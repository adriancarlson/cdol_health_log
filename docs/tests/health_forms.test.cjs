// Run with HEALTH_ANGULAR_TEST_DIR pointing to AngularJS 1.4.7 and angular-mocks.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../web_root/admin/students/health');
const angularDir = process.env.HEALTH_ANGULAR_TEST_DIR;
if (!angularDir) throw new Error('Set HEALTH_ANGULAR_TEST_DIR to the AngularJS 1.4.7 test runtime.');

function fixture(file) {
    return fs.readFileSync(path.join(root, file), 'utf8')
        .replace(/~\[tlist_sql;[\s\S]*?\[\/tlist_sql\]/g, '')
        .replace(/~\[x:insertfile;[^\n]+/g, '')
        .replace(/~\[if\.[^\n]+/g, '')
        .replace(/~\[if#.*?\]/g, '')
        .replace(/\[(?:else|\/if)[^\]]*\]/g, '')
        .replace(/~\(\[students.U_STUDENT_ADDITIONAL_INFO\]MED_SIG_DATE\)/gi, '09/22/2026')
        .replace(/~\(\[students.U_STUDENT_ADDITIONAL_INFO\]MED_SIG\)/gi, 'Example Guardian')
        .replace(/~\(\[students.U_STUDENT_ADDITIONAL_INFO\][A-Z_]*COLLECTION_METHOD\)/gi, 'Return to school office')
        .replace(/~\[x:username;firstlast\]/g, 'Test Admin')
        .replace(/~\[date\]/g, '09/22/2026')
        .replace(/~\(rn\)/g, '123')
        .replace(/~\(studentfrn\)/g, '001123')
        .replace(/~\(first_name\)/g, 'Example')
        .replace(/~\(last_name\)/g, 'Student')
        .replace(/~\[[^\]]*\]/g, '')
        .replace(/<link[^>]*>/g, '')
        .replace(/action="[^"]*"/, 'action="http://localhost/fixture.html?frn=001123&changesSaved=true"')
        .replace('value="" size="40"', 'value="Example Hospital" size="40"')
        .replace('name="[01]Doctor_Name" value=""', 'name="[01]Doctor_Name" value="Example Doctor"')
        .replace('name="[01]Doctor_Phone" value=""', 'name="[01]Doctor_Phone" value="402-555-0100"')
        .replace(/(name="\[students.U_STUDENT_ADDITIONAL_INFO\]ACETAMINOPHEN" value="1")/g, '$1 checked')
        .replace(/(name="\[students.U_STUDENT_ADDITIONAL_INFO\]MED_SHARE_CONSENT" value="1")/g, '$1 checked')
        .replace(/(id="hospitalConsentValue"\s+name="[^"]+" value=")"/, '$11"')
        .replace(/~\[self.page\]/g, 'fixture.html');
}

async function main() {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        for (const file of ['medical_authorization.html', 'health_history.html']) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setContent(fixture(file));
            await page.addStyleTag({ path: path.join(root, 'healthForms.css') });
            await page.addScriptTag({ path: path.join(angularDir, 'angular.js') });
            await page.addScriptTag({ path: path.join(angularDir, 'angular-mocks.js') });
            await page.evaluate(() => {
                angular.module('powerSchoolModule', []);
                window.define = (dependencies, factory) => factory(angular);
                window.psConfirm = config => { window.pendingConfirmation = config; };
            });
            await page.addScriptTag({ path: path.join(root, 'healthForms.js') });
            await page.evaluate(() => {
                window.testWrites = [];
                window.auditFails = false;
                window.medications = [{ medication_id: '10', studentsdcid: '123', name: 'Example Medicine', dosage: '5', dosage_units: 'mg', frequency_taken: 'Daily' }];
                angular.module('healthTest', ['cdolHealthForms', 'ngMockE2E']).run(['$httpBackend', function (backend) {
                    backend.whenPOST(/\/ws\/schema\/query\//).respond(() => [200, { record: window.medications }]);
                    backend.whenGET(/u_cdol_health_option/).respond(200, { tables: { u_cdol_health_option: [
                        { codetype: 'MED_DOSE_UNIT', code: 'mg', displayvalue: '(MG) Milligrams', isvisible: '1' },
                        { codetype: 'MED_DOSE_UNIT', code: 'ml', displayvalue: '(ML) Milliliters', isvisible: '1' }
                    ] } });
                    ['POST', 'PUT', 'DELETE'].forEach(method => backend.when(method, /\/ws\/schema\/table\/u_fb_medications/).respond((m, url, body) => {
                        window.testWrites.push({ method: m, url, body });
                        if (m === 'DELETE') window.medications = [];
                        else if (m === 'PUT') Object.assign(window.medications[0], JSON.parse(body).tables.u_fb_medications);
                        else window.medications.push(Object.assign({ medication_id: '11' }, JSON.parse(body).tables.u_fb_medications));
                        return [200, { result: [{ status: 'SUCCESS' }] }];
                    }));
                    backend.whenPOST(/healthAuditSaved/).respond((m, url, body) => {
                        window.testWrites.push({ method: m, url, body });
                        return [200, window.auditFails ? '<html>Sign in</html>' : '<span id="healthAuditReceipt" data-type="Admin" data-user="Test Admin" data-date="09/22/2026"></span>'];
                    });
                }]);
                angular.bootstrap(document.querySelector('.cdol-health-forms'), ['healthTest']);
                window.mainVm = angular.element(document.querySelector('.cdol-health-forms')).scope().vm;
                window.formSubmissions = [];
                document.querySelector('form').addEventListener('submit', event => {
                    window.formSubmissions.push({ prevented: event.defaultPrevented, values: Array.from(new FormData(event.target)) });
                    event.preventDefault();
                });
            });
            assert.equal(await page.evaluate(() => angular.version.full), '1.4.7');
            await page.waitForFunction(() => !window.mainVm.medicationBlocked);
            assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false, 'initial values are pristine');
            if (file === 'health_history.html') {
                assert.equal(await page.locator('#healthDoctorName').inputValue(), 'Example Doctor');
                await page.locator('#healthDoctorName').fill('New Doctor');
                assert.equal(await page.evaluate(() => window.mainVm.form.$dirty), true);
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                await page.locator('#healthDoctorName').fill('Example Doctor');
                assert.equal(await page.evaluate(() => window.mainVm.form.$dirty), true);
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false, 'reverted edit is not a data change');
                const sports = page.locator('#healthCanPlaySports');
                assert.equal(await page.locator('#healthSportsAccommodations').isVisible(), false);
                assert.equal(await page.locator('#healthSportsAccommodations').isDisabled(), true);
                await sports.selectOption('Yes - With Accommodations');
                assert.equal(await page.locator('#healthSportsAccommodations').isVisible(), true);
                assert.equal(await page.locator('#healthUnapprovedActivities').isVisible(), true);
                await page.locator('#healthSportsAccommodations').fill('Rest breaks');
                await sports.selectOption('0');
                assert.equal(await page.locator('#healthSportsAccommodations').isVisible(), false);
                assert.equal(await page.locator('#healthUnapprovedActivities').isVisible(), true);
                await sports.selectOption('');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false, 'hidden dependent edits do not cause a false audit');
                assert.equal(await page.evaluate(() => new FormData(document.querySelector('form')).has('[Students.U_STUDENT_ADDITIONAL_INFO]SPORTS_ACCOMODATIONS')), false);
                await sports.selectOption('Yes - With Accommodations');
                assert.equal(await page.locator('#healthSportsAccommodations').inputValue(), 'Rest breaks', 'hidden values are preserved');
                await sports.selectOption('');
                const setQuestion = async (name, value) => page.locator('input[name="[students.U_STUDENT_ADDITIONAL_INFO]' + name + '"][value="' + value + '"]').check();
                await page.evaluate(() => { window.mainVm.formSchool = '311'; angular.element(document.querySelector('.cdol-health-forms')).scope().$apply(); });
                await setQuestion('ASTHMA', '1');
                assert.equal(await page.evaluate(() => window.mainVm.show('asthmaAllergyPlan')), false);
                await setQuestion('INHALER', '1');
                assert.equal(await page.evaluate(() => window.mainVm.show('asthmaAllergyPlan')), true);
                assert.equal(await page.evaluate(() => window.mainVm.show('inhalerContract')), true);
                await setQuestion('INHALER', '0');
                await setQuestion('EPIPEN', '1');
                assert.equal(await page.evaluate(() => window.mainVm.show('asthmaAllergyPlan')), true);
                assert.equal(await page.evaluate(() => window.mainVm.show('inhalerContract')), false);
                await setQuestion('EPIPEN', '0');
                await setQuestion('SEIZURE_AGREE', '1');
                await page.evaluate(() => { window.mainVm.formSchool = '130'; angular.element(document.querySelector('.cdol-health-forms')).scope().$apply(); });
                assert.equal(await page.evaluate(() => window.mainVm.show('seizurePlan')), true);
                await setQuestion('SEIZURE_AGREE', '0');
                await setQuestion('DIABETES', '1');
                await page.evaluate(() => { window.mainVm.formSchool = '101'; angular.element(document.querySelector('.cdol-health-forms')).scope().$apply(); });
                assert.equal(await page.evaluate(() => window.mainVm.show('diabetesPlan')), false);
                await page.evaluate(() => { window.mainVm.formSchool = '104'; angular.element(document.querySelector('.cdol-health-forms')).scope().$apply(); });
                assert.equal(await page.evaluate(() => window.mainVm.show('diabetesPlan')), true);
                await setQuestion('DIABETES', '0');
                assert.equal(await page.locator('#dentalPlanMethod').getAttribute('name'), null, 'parent return method is not posted');
                for (const group of await page.locator('[health-parent-return]').all()) {
                    assert.equal(await group.locator('input[type="radio"]').count(), 2);
                    assert.equal(await group.locator('input:checked').inputValue(), 'Return to school office');
                    assert.equal(await group.locator('input:not(:disabled)').count(), 0);
                    assert.equal(await group.locator('input[name]').count(), 0);
                }
                assert.equal(await page.evaluate(() => Array.from(new FormData(document.querySelector('form')).keys()).some(key => /collection_method/i.test(key))), false);
                assert.equal(await page.locator('input[type="file"]').count(), 0);
                assert.equal(await page.locator('a[href*="formid=24779195"]').count(), 0, 'no upload links');
                await setQuestion('ALLERGY_AGREE', '1');
                assert.equal(await page.locator('#healthAllergyTable').count(), 0, 'no allergy collection UI');
                await page.locator('#healthAllergies').fill('Peanuts');
                assert.equal(await page.evaluate(() => new FormData(document.querySelector('form')).get('[students.StudentCoreFields]allergies')), 'Peanuts');
                await setQuestion('ALLERGY_AGREE', '0');
                assert.equal(await page.locator('#healthAllergies').isDisabled(), true);
                await setQuestion('ALLERGY_AGREE', '1');
                assert.equal(await page.locator('#healthAllergies').inputValue(), 'Peanuts', 'allergy field retains hidden value');
                assert.equal(await page.evaluate(() => window.testWrites.length), 0, 'no independent allergy requests');
                const schoolResults = await page.evaluate(() => {
                    const scope = angular.element(document.querySelector('.cdol-health-forms')).scope();
                    const results = [];
                    ['diabetes', 'seizure_agree', 'inhaler', 'epipen', 'allergy_agree'].forEach(key => { window.mainVm.values['[students.u_student_additional_info]' + key] = '1'; });
                    for (const school of ['101', '104', '110', '120', '130', '131', '210', '211', '311', '999']) {
                        window.mainVm.formSchool = school;
                        scope.$apply();
                        const shown = id => !document.getElementById(id).closest('section').classList.contains('ng-hide');
                        results.push({ school, dental: shown('dentalPlanHeading'), agreement: shown('dentalAgreementHeading'), diabetes: shown('diabetesPlanHeading'),
                            seizure: shown('seizurePlanHeading'), inhaler: shown('inhalerContractHeading'), meal: shown('mealPlanHeading'), notice: shown('medicalCareNoticeHeading') });
                    }
                    return results;
                });
                for (const result of schoolResults) {
                    assert.equal(result.dental, result.school === '104');
                    assert.equal(result.agreement, result.school === '120');
                    assert.equal(result.diabetes, result.school !== '101');
                    assert.equal(result.seizure, ['130', '131'].includes(result.school));
                    assert.equal(result.inhaler, result.school === '311');
                    assert.equal(result.meal, ['110', '130', '131'].includes(result.school));
                    assert.equal(result.notice, ['210', '211'].includes(result.school));
                }
            } else {
                assert.equal(await page.locator('#hospitalConsentCheckbox').isChecked(), true, 'hospital consent seeded');
                const consent = page.locator('input[name="[students.U_STUDENT_ADDITIONAL_INFO]MED_SHARE_CONSENT"]');
                assert.equal(await consent.isChecked(), true);
                await consent.uncheck();
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                await consent.check();
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                await page.getByRole('button', { name: 'Edit Prescription Medication', exact: true }).click();
                assert.equal(await page.getByRole('button', { name: 'Delete Prescription Medication', exact: true }).isVisible(), false);
                const row = page.locator('tr.prescription-medication-editing');
                assert.equal(await row.getByRole('button', { name: 'Submit', exact: true }).isDisabled(), true);
                await row.getByLabel('Dosage', { exact: true }).fill('6');
                await row.getByLabel('Dosage', { exact: true }).fill('5');
                assert.equal(await row.getByRole('button', { name: 'Submit', exact: true }).isDisabled(), true);
                await row.getByLabel('Dosage', { exact: true }).fill('6');
                await row.getByRole('button', { name: 'Submit', exact: true }).click();
                await page.waitForFunction(() => window.testWrites.length === 2 && !window.mainVm.medicationBlocked).catch(async error => {
                    console.error(await page.evaluate(() => ({ writes: window.testWrites, feedback: document.querySelector('#prescriptionMedicationFeedback') && document.querySelector('#prescriptionMedicationFeedback').textContent, action: document.querySelector('form').action })), errors);
                    throw error;
                });
                const writes = await page.evaluate(() => window.testWrites);
                assert.equal(writes[0].method, 'PUT');
                assert.equal(JSON.parse(writes[0].body).tables.u_fb_medications.dosage, '6');
                assert.equal(writes[1].body.includes('ACETAMINOPHEN'), false, 'audit request excludes unsaved main form fields');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                await page.getByRole('button', { name: 'Add Medication', exact: true }).click();
                assert.equal(await row.getByRole('button', { name: 'Submit', exact: true }).isDisabled(), true);
                await row.getByLabel('Medication Name', { exact: true }).fill('Another Medicine');
                await row.getByLabel('Dosage', { exact: true }).fill('2');
                await row.getByLabel('Dosage Units', { exact: true }).selectOption({ label: '(ML) Milliliters' });
                await row.getByLabel('Frequency Taken', { exact: true }).fill('Daily');
                await page.evaluate(() => { window.auditFails = true; });
                await row.getByRole('button', { name: 'Submit', exact: true }).click();
                await page.getByRole('button', { name: 'Retry Audit Stamp' }).waitFor();
                assert.equal(await page.evaluate(() => window.mainVm.medicationBlocked), true);
                await page.evaluate(() => { window.auditFails = false; });
                await page.getByRole('button', { name: 'Retry Audit Stamp' }).click();
                await page.waitForFunction(() => !window.mainVm.medicationBlocked);
                assert.equal((await page.evaluate(() => window.testWrites)).filter(w => w.url.includes('u_fb_medications') && w.method === 'POST').length, 1, 'audit retry never repeats medication creation');
                await page.getByRole('button', { name: 'Delete Prescription Medication', exact: true }).first().click();
                await page.evaluate(() => window.pendingConfirmation.ok());
                await page.waitForFunction(() => window.testWrites.some(w => w.method === 'DELETE') && !window.mainVm.medicationBlocked);
                assert.equal(await page.getByText('No Prescription Medications for Example Student.').isVisible(), true);
                await page.locator('#hospitalConsentCheckbox').uncheck();
                assert.equal(await page.locator('#hospitalConsentValue').inputValue(), '0');
            }
            const field = file === 'health_history.html' ? page.locator('#healthDoctorName') : page.locator('#hospitalConsentCheckbox');
            if (file === 'health_history.html') await field.fill('Changed Doctor');
            await page.locator('form button[type="submit"]').click();
            assert.equal(await page.locator('#medLastUpdatedBy').inputValue(), 'Test Admin');
            assert.equal(await page.evaluate(() => window.formSubmissions[0].prevented), false, 'changed main form reaches native PowerSchool submission');
            if (file === 'health_history.html') {
                const submitted = new Map(await page.evaluate(() => window.formSubmissions[0].values));
                assert.equal(submitted.get('[students.StudentCoreFields]allergies'), 'Peanuts');
                assert.equal(submitted.get('[students.U_STUDENT_ADDITIONAL_INFO]MED_LAST_UPDATED_BY'), 'Test Admin');
                assert.equal([...submitted.keys()].some(key => /collection_method/i.test(key)), false);
            }
            assert.deepEqual(errors, []);
            if (process.env.HEALTH_FORM_SCREENSHOT_DIR) {
                await page.screenshot({ path: path.join(process.env.HEALTH_FORM_SCREENSHOT_DIR, file + '.png'), fullPage: true });
            }
            console.log('PASS ' + file + ': initialization, dirty/reverted changes, native submission' + (file.startsWith('medical_') ? ', CRUD, required fields, independent audit, audit retry' : ', ten school branches, hidden-field preservation, read-only parent radio choices, native allergy field'));
            await page.close();
        }
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
