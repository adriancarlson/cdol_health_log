// Run with HEALTH_ANGULAR_TEST_DIR pointing to AngularJS 1.4.7 and angular-mocks.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../web_root/admin/students/health');
const angularDir = process.env.HEALTH_ANGULAR_TEST_DIR;
const renderedNames = process.env.HEALTH_RENDERED_NAMES === '1';
function postedName(name) {
    if (!renderedNames) return name;
    return name.replace(/^\[students\.([^\]]+)\](.+)$/i, 'EF-001123-$1.$2')
        .replace(/^\[students\](.+)$/i, 'UF-001123-$1')
        .replace(/^\[01\](.+)$/i, 'UF-001123-$1');
}
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
        .replace(/~\(schoolname\)/g, 'Example School')
        .replace(/~\[[^\]]*\]/g, '')
        .replace(/<link[^>]*>/g, '')
        .replace(/action="[^"]*"/, 'action="http://localhost/fixture.html?frn=001123&changesSaved=true"')
        .replace('value="" size="40"', 'value="Example Hospital" size="40"')
        .replace('name="[01]Doctor_Name" value=""', 'name="[01]Doctor_Name" value="Example Doctor"')
        .replace('name="[01]Doctor_Phone" value=""', 'name="[01]Doctor_Phone" value="402-555-0100"')
        .replace('id="healthCanPlaySportsYes"', 'id="healthCanPlaySportsYes" checked')
        .replace('id="healthActionPlanAlert"', 'id="healthActionPlanAlert" checked')
        .replace(/(id="healthMedicalAlert"[^>]*>)/, '$1Existing medical alert')
        .replace(/(id="healthMedicalAlertExpires"\s+name="[^"]+"\s+value=")"/, '$10/0/0"')
        .replace(/(name="\[students.U_STUDENT_ADDITIONAL_INFO\]ACETAMINOPHEN" value="1")/g, '$1 checked')
        .replace(/(name="\[students.U_STUDENT_ADDITIONAL_INFO\]MED_SHARE_CONSENT" value="1")/g, '$1 checked')
        .replace(/(name="\[students.U_STUDENT_ADDITIONAL_INFO\]MED_FIRST_AID_CONSENT" value="1")/g, '$1 checked')
        .replace(/(id="hospitalConsentValue"\s+name="[^"]+" value=")"/, '$11"')
        .replace(/~\[self.page\]/g, 'fixture.html');
}

async function main() {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        for (const [scenario, file] of ['medical_authorization.html', 'health_history.html', 'medical_authorization.html'].entries()) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setContent(fixture(file));
            if (renderedNames) {
                // Reproduce server rendering, including native unchecked companions.
                await page.evaluate(() => {
                    document.querySelectorAll('input[name^="["], select[name^="["], textarea[name^="["]').forEach(field => {
                        const sourceName = field.name;
                        const key = sourceName.replace(/^\[01\]/, 'students.').replace(/^\[([^\]]+)\]/, '$1.').toLowerCase();
                        field.name = sourceName.replace(/^\[students\.([^\]]+)\](.+)$/i, 'EF-001123-$1.$2').replace(/^\[students\](.+)$/i, 'UF-001123-$1').replace(/^\[01\](.+)$/i, 'UF-001123-$1');
                        field.setAttribute('data-validation', JSON.stringify({ key, type: field.type === 'checkbox' || field.type === 'radio' ? 'boolean' : 'text' }));
                        if (field.type === 'checkbox') {
                            const companion = document.createElement('input');
                            companion.type = 'hidden';
                            companion.name = field.name;
                            companion.value = '';
                            field.before(companion);
                        }
                    });
                });
            }
            await page.addStyleTag({ path: path.join(root, 'healthForms.css') });
            await page.addScriptTag({ path: path.join(angularDir, 'angular.js') });
            await page.addScriptTag({ path: path.join(angularDir, 'angular-mocks.js') });
            await page.evaluate(() => {
                angular.module('powerSchoolModule', []).config(['$provide', function ($provide) {
                    // Reproduce the installed PowerSchool decorator's no-pssValidationForm branch.
                    $provide.decorator('ngSubmitDirective', ['$delegate', function (directives) {
                        const originalCompile = directives[0].compile;
                        directives[0].compile = function () { return originalCompile; };
                        return directives;
                    }]);
                }]);
                window.dialogVisible = false;
                window.dialogOpens = 0;
                window.dialogCloses = 0;
                window.loadingDialog = () => { window.dialogVisible = true; window.dialogOpens++; };
                window.closeLoading = () => { window.dialogVisible = false; window.dialogCloses++; };
                // PowerSchool adds its automatic native loading handler to forms without this opt-out.
                document.querySelectorAll('form:not(.noSubmitLoading)').forEach(form => form.addEventListener('submit', window.loadingDialog));
                window.define = (dependencies, factory) => factory(angular);
                window.psConfirm = config => { window.pendingConfirmation = config; };
            });
            await page.addScriptTag({ path: path.join(root, 'healthForms.js') });
            await page.evaluate(startEmpty => {
                window.testWrites = [];
                window.auditFails = false;
                window.loadFails = false;
                window.ignoreSave = false;
                window.studentData = { student_dcid: '123', record_exists: 1, today: '2026-09-23',
                    med_share_consent: '1', med_first_aid_consent: '1', hospital_consent: '1', student_medication: '1',
                    acetaminophen: '1', ibuprofen: '0', antihistamine: null, antacid: '1', antibiotic: '0', hydrocortisone: '1', cough_drop: '0',
                    parent_name: 'Example Guardian', parent_date: '09/22/2026', last_updated_message: 'Last Updated by Parent: Example Guardian - 09/22/2026' };
                window.medications = [{ medication_id: '10', studentsdcid: '123', name: 'Example Medicine', dosage: '5', dosage_units: 'mg', frequency_taken: 'Daily' }];
                if (startEmpty) { window.medications = []; window.studentData.student_medication = null; }
                angular.module('healthTest', ['cdolHealthForms', 'ngMockE2E']).run(['$httpBackend', function (backend) {
                    backend.whenGET(/medicalAuthorization\.json/).respond(() => window.loadFails ? [200, '<html>Sign in</html>'] : [200, [window.studentData]]);
                    ['POST', 'PUT'].forEach(method => backend.when(method, /\/ws\/schema\/table\/u_student_additional_info/).respond((m, url, body) => {
                        window.testWrites.push({ method: m, url, body });
                        if (window.auditFails) return [200, { result: [{ error_message: 'Permission denied' }] }];
                        const values = JSON.parse(body).tables.u_student_additional_info;
                        if (!window.ignoreSave) {
                            Object.entries(values).forEach(([key, value]) => {
                                window.studentData[key] = value === 'true' ? '1' : value === 'false' ? '0' : value;
                            });
                            Object.assign(window.studentData, { record_exists: 1, audit_name: values.med_last_updated_by,
                                audit_user_type: values.med_last_updated_user_type, audit_date: values.med_last_updated_date,
                                last_updated_message: 'Last Updated by Admin: Test Admin - 09/23/2026' });
                        }
                        return [200, { result: [{ status: 'SUCCESS' }] }];
                    }));
                    backend.whenPOST(/\/ws\/schema\/query\//).respond(() => [200, window.medicationResponseOverride || (window.medications.length ?
                        { record: window.medications } : { name: 'students', '@extensions': 'u_student_additional_info' })]);
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
                window.initialLoadingState = {
                    hidden: document.querySelector('.cdol-health-forms').classList.contains('ng-hide'),
                    dialog: window.dialogVisible
                };
                window.formSubmissions = [];
                document.querySelector('form').addEventListener('submit', event => {
                    window.formSubmissions.push({ prevented: event.defaultPrevented, values: Array.from(new FormData(event.target)) });
                    event.preventDefault();
                });
            }, scenario === 2);
            assert.equal(await page.evaluate(() => angular.version.full), '1.4.7');
            await page.waitForFunction(() => !window.mainVm.medicationBlocked);
            assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false, 'initial values are pristine');
            if (file === 'medical_authorization.html') await page.waitForFunction(() => window.mainVm.loaded && !window.mainVm.busy);
            if (file === 'medical_authorization.html') {
                assert.deepEqual(await page.evaluate(() => window.initialLoadingState), { hidden: true, dialog: true }, 'hide sections while native loading dialog is open');
                assert.equal(await page.locator('.cdol-health-forms').isVisible(), true);
                assert.equal(await page.evaluate(() => window.dialogVisible), false);
                assert.equal(await page.getByText('Loading or saving medical authorizations...', { exact: true }).count(), 0);
                assert.equal(await page.getByText('Loading prescription medications...', { exact: true }).count(), 0);
                for (const name of [null, '', '   ', 'null']) {
                    await page.evaluate(name => {
                        const scope = angular.element(document.querySelector('.cdol-health-forms')).scope();
                        scope.$apply(() => { scope.vm.record.parent_name = name; });
                    }, name);
                    assert.equal(await page.locator('#parentGuardianSignatureSection').count(), 0);
                }
                await page.evaluate(() => {
                    const scope = angular.element(document.querySelector('.cdol-health-forms')).scope();
                    scope.$apply(() => { scope.vm.record.parent_name = 'Example Guardian'; });
                });
                assert.equal(await page.locator('#parentGuardianSignatureSection').isVisible(), true);
                assert.equal(await page.evaluate(() => {
                    const form = document.querySelector('#medicalForm');
                    const submit = form.querySelector('button[type="submit"]');
                    const signature = document.querySelector('#parentGuardianSignatureSection');
                    const add = document.querySelector('#addPrescriptionMedicationButton');
                    const table = document.querySelector('#prescriptionMedicationsTable');
                    return form.contains(document.querySelector('input[name="student_medication"]')) &&
                        Boolean(signature.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING) &&
                        !add.closest('.medical-section-banner') &&
                        Boolean(add.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING);
                }), true, 'question belongs to main form; Add is above the table; Submit follows all sections');
            }
            if (scenario === 2) {
                assert.equal(await page.locator('#prescriptionMedicationsTable').isVisible(), false, 'blank answer hides the table');
                assert.equal(await page.locator('#addPrescriptionMedicationButton').isVisible(), false);
                assert.equal(await page.locator('input[name="student_medication"]:checked').count(), 0);
                await page.evaluate(() => {
                    window.studentData.student_medication = '0';
                    angular.element(document.querySelector('.cdol-health-forms')).scope().$apply(() => window.mainVm.load());
                });
                await page.waitForFunction(() => window.mainVm.loaded && !window.mainVm.busy);
                assert.equal(await page.locator('input[name="student_medication"][value="0"]').isChecked(), true);
                assert.equal(await page.locator('#prescriptionMedicationsTable').isVisible(), false, 'saved No hides the table');
                await page.locator('input[name="student_medication"][value="1"]').check();
                assert.equal(await page.getByText('No Prescription Medications for Example Student.', { exact: true }).isVisible(), true);
                assert.equal(await page.locator('#prescriptionMedicationFeedback').count(), 0, 'empty response is not a load error');
                assert.equal(await page.locator('#addPrescriptionMedicationButton').isEnabled(), true);
                await page.locator('#addPrescriptionMedicationButton').click();
                const row = page.locator('tr.prescription-medication-editing');
                await row.getByLabel('Medication Name', { exact: true }).fill('First Example Medicine');
                await row.getByLabel('Dosage', { exact: true }).fill('5');
                await row.getByLabel('Dosage Units', { exact: true }).selectOption({ label: '(MG) Milligrams' });
                await row.getByLabel('Frequency Taken', { exact: true }).fill('Daily');
                await row.getByRole('button', { name: 'Submit', exact: true }).click();
                await page.waitForFunction(() => window.testWrites.length === 2 && !window.mainVm.medicationBlocked);
                assert.equal(await page.getByText('First Example Medicine', { exact: true }).isVisible(), true);
                assert.equal(await page.evaluate(() => window.testWrites[0].method), 'POST');
                assert.equal(await page.evaluate(() => JSON.parse(window.testWrites[0].body).tables.u_fb_medications.studentsdcid), '123');
                assert.equal(await page.locator('#addPrescriptionMedicationButton').isEnabled(), true);
                assert.equal(await page.evaluate(() => window.mainVm.appData.student_medication), '1', 'medication audit preserves the unsaved Yes answer');
                await page.locator('form button[type="submit"]').click();
                await page.waitForFunction(() => !window.mainVm.busy && !window.mainVm.hasChanges());
                assert.equal(await page.evaluate(() => JSON.parse(window.testWrites[2].body).tables.u_student_additional_info.student_medication), 'true');
                await page.locator('input[name="student_medication"][value="0"]').check();
                await page.locator('form button[type="submit"]').click();
                await page.waitForFunction(() => !window.mainVm.busy && !window.mainVm.hasChanges());
                assert.equal(await page.evaluate(() => JSON.parse(window.testWrites[3].body).tables.u_student_additional_info.student_medication), 'false');
                assert.equal(await page.locator('#prescriptionMedicationsTable').isVisible(), false);
                assert.equal(await page.evaluate(() => window.medications.length), 1, 'No preserves saved medication records');
                assert.equal(await page.evaluate(() => window.testWrites.some(write => write.method === 'DELETE')), false);
                // A malformed/error envelope must still reject instead of permitting writes.
                for (const response of ['<html>Sign in</html>', {}, { name: 'students', '@extensions': '', error_message: 'Permission denied' }]) {
                    assert.equal(await page.evaluate(async response => {
                        window.medicationResponseOverride = response;
                        const element = angular.element(document.querySelector('.cdol-health-forms'));
                        const api = element.injector().get('prescriptionApi');
                        return new Promise(resolve => element.scope().$apply(() => {
                            api.list('123').then(() => resolve(false), () => resolve(true));
                        }));
                    }, response), true);
                }
                assert.deepEqual(errors, []);
                assert.equal(await page.evaluate(() => window.dialogVisible), false);
                assert.equal(await page.evaluate(() => window.dialogOpens === window.dialogCloses), true);
                console.log('PASS prescription question: blank/No/Yes visibility, Boolean saves, preserved medication records, first medication creation, audit, malformed-response rejection');
                await page.close();
                continue;
            }
            if (file === 'health_history.html') {
                assert.equal(await page.locator('.health-alerts + section #sportsParticipationHeading').count(), 1);
                assert.equal(await page.locator('#healthAllergies').count(), 1, 'only one allergy input is submitted');
                assert.equal(await page.locator('#healthMedicalAlert').inputValue(), 'Existing medical alert');
                assert.equal(await page.locator('#healthMedicalAlertExpires').inputValue(), '0/0/0');
                assert.equal(await page.locator('#healthActionPlanAlert').isChecked(), true, 'saved checked alert initializes');
                assert.equal(await page.locator('#healthConcussionAlert').isChecked(), false);
                for (const [id, key, initial] of [
                    ['healthActionPlanAlert', 'ihp_alert', '1'],
                    ['healthConcussionAlert', 'concussion_alert', '0']
                ]) {
                    const checkbox = page.locator('#' + id);
                    await checkbox.setChecked(initial !== '1');
                    assert.equal(await page.evaluate(key => window.mainVm.answer(key), key), initial === '1' ? '0' : '1');
                    assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                    await checkbox.setChecked(initial === '1');
                    assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false, 'reverted alert checkbox does not stamp an audit');
                }
                await page.locator('#healthMedicalAlert').fill('Changed medical alert');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                await page.locator('#healthMedicalAlert').fill('Existing medical alert');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                assert.equal(await page.locator('#healthDoctorName').inputValue(), 'Example Doctor');
                await page.locator('#healthDoctorName').fill('New Doctor');
                assert.equal(await page.evaluate(() => window.mainVm.form.$dirty), true);
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                await page.locator('#healthDoctorName').fill('Example Doctor');
                assert.equal(await page.evaluate(() => window.mainVm.form.$dirty), true);
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false, 'reverted edit is not a data change');
                const sports = value => page.locator('input[name="' + postedName('[students.U_STUDENT_ADDITIONAL_INFO]CAN_PLAY_SPORTS') + '"][value="' + value + '"]');
                assert.equal(await sports('1').isChecked(), true);
                assert.equal(await page.locator('#healthSportsAccommodations').isVisible(), false);
                assert.equal(await page.locator('#healthSportsAccommodations').isDisabled(), true);
                assert.equal(await page.locator('#healthUnapprovedActivities').isVisible(), false);
                await sports('Yes - With Accommodations').check();
                assert.equal(await page.locator('#healthSportsAccommodations').isVisible(), true);
                assert.equal(await page.locator('#healthUnapprovedActivities').isVisible(), true);
                await page.locator('#healthSportsAccommodations').fill('Rest breaks');
                await page.locator('#healthUnapprovedActivities').fill('Physical Education');
                await sports('0').check();
                assert.equal(await page.locator('#healthSportsAccommodations').isVisible(), false);
                assert.equal(await page.locator('#healthUnapprovedActivities').isVisible(), true);
                assert.equal(await page.evaluate(name => new FormData(document.querySelector('form')).get(name), postedName('[students.U_STUDENT_ADDITIONAL_INFO]CAN_PLAY_SPORTS')), '0');
                assert.equal(await page.evaluate(name => new FormData(document.querySelector('form')).get(name), postedName('[Students.U_STUDENT_ADDITIONAL_INFO]UNAPPROVED_ACTIVITES')), 'Physical Education');
                await sports('1').check();
                assert.equal(await page.locator('#healthUnapprovedActivities').isVisible(), false);
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false, 'hidden dependent edits do not cause a false audit');
                assert.equal(await page.evaluate(name => new FormData(document.querySelector('form')).has(name), postedName('[Students.U_STUDENT_ADDITIONAL_INFO]SPORTS_ACCOMODATIONS')), false);
                assert.equal(await page.evaluate(name => new FormData(document.querySelector('form')).has(name), postedName('[Students.U_STUDENT_ADDITIONAL_INFO]UNAPPROVED_ACTIVITES')), false);
                await sports('Yes - With Accommodations').check();
                assert.equal(await page.locator('#healthSportsAccommodations').inputValue(), 'Rest breaks', 'hidden values are preserved');
                assert.equal(await page.locator('#healthUnapprovedActivities').inputValue(), 'Physical Education');
                assert.equal(await page.evaluate(name => new FormData(document.querySelector('form')).get(name), postedName('[students.U_STUDENT_ADDITIONAL_INFO]CAN_PLAY_SPORTS')), 'Yes - With Accommodations');
                await sports('1').check();
                const setQuestion = async (name, value) => page.locator('input[name="' + postedName('[students.U_STUDENT_ADDITIONAL_INFO]' + name) + '"][value="' + value + '"]').check();
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
                assert.equal(await page.evaluate(name => new FormData(document.querySelector('form')).get(name), postedName('[students.StudentCoreFields]allergies')), 'Peanuts');
                await setQuestion('ALLERGY_AGREE', '0');
                assert.equal(await page.locator('#healthAllergies').isDisabled(), false, 'Allergy Alert remains available independently of the history answer');
                await setQuestion('ALLERGY_AGREE', '1');
                assert.equal(await page.locator('#healthAllergies').inputValue(), 'Peanuts');
                assert.equal(await page.evaluate(() => window.testWrites.length), 0, 'no independent allergy requests');
                await page.locator('#healthMedicalAlert').fill('Example medical alert instructions');
                await page.locator('#healthMedicalAlertExpires').fill('06/01/2027');
                await page.locator('#healthActionPlanNote').fill('Example action plan instructions');
                await page.locator('#healthConcussionAlert').check();
                await page.locator('#healthConcussionNote').fill('Example concussion instructions');
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
                const consent = page.locator('input[type="checkbox"][name="' + 'med_share_consent' + '"]');
                assert.equal(await consent.isChecked(), true);
                const firstAid = page.locator('input[type="checkbox"][name="' + 'med_first_aid_consent' + '"]');
                assert.equal(await firstAid.isChecked(), true, 'saved first aid consent seeded');
                await firstAid.uncheck();
                assert.equal(await page.evaluate(() => window.mainVm.appData.med_first_aid_consent), '0');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                await firstAid.check();
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                await page.locator('input[name="' + 'acetaminophen' + '"][value="0"]').check();
                assert.equal(await page.evaluate(() => window.mainVm.appData.acetaminophen), '0');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                await page.locator('input[name="' + 'acetaminophen' + '"][value="1"]').check();
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                await consent.uncheck();
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true);
                await consent.check();
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                await page.evaluate(() => { window.mainVm.submit(); });
                assert.equal(await page.evaluate(() => window.testWrites.length), 0, 'reverted edits do not save or stamp audit');
                await page.locator('#hospitalConsentCheckbox').uncheck();
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
                assert.deepEqual(Object.keys(JSON.parse(writes[1].body).tables.u_student_additional_info).sort(),
                    ['med_last_updated_by', 'med_last_updated_date', 'med_last_updated_user_type'], 'prescription audit excludes unsaved authorizations');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), true, 'audit keeps the unsaved consent edit');
                assert.equal(await page.locator('#hospitalConsentCheckbox').isChecked(), false);
                assert.equal(await page.evaluate(() => window.studentData.hospital_consent), '1');
                await page.locator('#hospitalConsentCheckbox').check();
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
                assert.equal(await page.evaluate(() => window.mainVm.appData.hospital_consent), '0');
            }
            const field = file === 'health_history.html' ? page.locator('#healthDoctorName') : page.locator('#hospitalConsentCheckbox');
            if (file === 'health_history.html') await field.fill('Changed Doctor');
            await page.locator('form button[type="submit"]').click();

            if (file === 'health_history.html') {
                assert.equal(await page.locator('#medLastUpdatedBy').inputValue(), 'Test Admin');
                assert.equal(await page.evaluate(() => window.formSubmissions[0].prevented), false, 'Health History retains native submission');
                const submitted = new Map(await page.evaluate(() => window.formSubmissions[0].values));
                assert.equal(submitted.get(postedName('[students.StudentCoreFields]allergies')), 'Peanuts');
                assert.equal(submitted.get(postedName('[students]alert_Medical')), 'Example medical alert instructions');
                assert.equal(submitted.get(postedName('[01]Alert_MedicalExpires')), '06/01/2027');
                assert.equal(submitted.get(postedName('[students.U_STUDENT_ADDITIONAL_INFO]IHP_ALERT')), '1');
                assert.equal(submitted.get(postedName('[students.U_STUDENT_ADDITIONAL_INFO]IHP_DESCRIPTION')), 'Example action plan instructions');
                assert.equal(submitted.get(postedName('[students.U_STUDENT_ADDITIONAL_INFO]CONCUSSION_ALERT')), '1');
                assert.equal(submitted.get(postedName('[students.U_STUDENT_ADDITIONAL_INFO]CONCUSSION_DESC')), 'Example concussion instructions');
                assert.equal(submitted.get(postedName('[students.U_STUDENT_ADDITIONAL_INFO]MED_LAST_UPDATED_BY')), 'Test Admin');
                assert.equal([...submitted.keys()].some(key => /collection_method/i.test(key)), false);
            } else {
                await page.waitForFunction(() => window.mainVm.loaded && !window.mainVm.busy && !window.mainVm.hasChanges());
                assert.equal(await page.evaluate(() => window.formSubmissions[0].prevented), true, 'Medical Authorization never posts the native form');
                const saved = await page.evaluate(() => JSON.parse(window.testWrites[window.testWrites.length - 1].body).tables.u_student_additional_info);
                assert.deepEqual(saved, { hospital_consent: '0', med_last_updated_user_type: 'Admin', med_last_updated_by: 'Test Admin', med_last_updated_date: '2026-09-23' });
                assert.equal(await page.locator('#medicalLastUpdated').innerText(), 'Last Updated by Admin: Test Admin - 09/23/2026');

                // Real Boolean API payloads, explicit false, blank values, and no inferred consent.
                await page.evaluate(() => {
                    Object.assign(window.studentData, { med_share_consent: '0', med_first_aid_consent: null, hospital_consent: null });
                    window.mainVm.load();
                });
                await page.waitForFunction(() => !window.mainVm.busy);
                assert.equal(await page.getByLabel('Parents consent to Emergency Treatment').isChecked(), false);
                assert.equal(await page.getByLabel('Parents consent to Basic First Aid Care').isChecked(), false);
                assert.equal(await page.locator('#hospitalConsentCheckbox').isChecked(), false);
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                await page.getByLabel('Parents consent to Basic First Aid Care').check();
                await page.locator('form button[type="submit"]').click();
                await page.waitForFunction(() => !window.mainVm.busy);
                assert.equal(await page.evaluate(() => JSON.parse(window.testWrites[window.testWrites.length - 1].body).tables.u_student_additional_info.med_first_aid_consent), 'true');
                assert.equal(await page.evaluate(() => window.studentData.hospital_consent), null, 'an unrelated save preserves blank hospital consent');

                // A success-shaped response is insufficient when read-back does not match.
                await page.evaluate(() => { window.ignoreSave = true; });
                await page.getByLabel('Parents consent to Basic First Aid Care').uncheck();
                await page.locator('form button[type="submit"]').click();
                await page.waitForFunction(() => !window.mainVm.busy);
                assert.equal(await page.evaluate(() => window.mainVm.loaded), false);
                assert.equal(await page.locator('form button[type="submit"]').isDisabled(), true);
                assert.equal(await page.evaluate(() => JSON.parse(window.testWrites[window.testWrites.length - 1].body).tables.u_student_additional_info.med_first_aid_consent), 'false');
                await page.evaluate(() => { window.ignoreSave = false; window.loadFails = true; window.mainVm.load(); });
                await page.waitForFunction(() => !window.mainVm.busy);
                assert.equal(await page.evaluate(() => window.mainVm.loaded), false, 'login HTML is not a successful load');
                await page.evaluate(() => { window.loadFails = false; window.studentData.student_dcid = '999'; window.mainVm.load(); });
                await page.waitForFunction(() => !window.mainVm.busy);
                assert.equal(await page.evaluate(() => window.mainVm.loaded), false, 'wrong student is rejected');
                await page.evaluate(() => { window.studentData.student_dcid = '123'; window.studentData.record_exists = 0; window.mainVm.load(); });
                await page.waitForFunction(() => !window.mainVm.busy);
                await page.locator('#hospitalConsentCheckbox').check();
                await page.locator('form button[type="submit"]').click();
                await page.waitForFunction(() => !window.mainVm.busy);
                const created = await page.evaluate(() => window.testWrites[window.testWrites.length - 1]);
                assert.equal(created.method, 'POST');
                assert.equal(JSON.parse(created.body).tables.u_student_additional_info.studentsdcid, '123');
                assert.equal(await page.evaluate(() => window.mainVm.loaded), true);
            }
            assert.deepEqual(errors, []);
            if (file === 'medical_authorization.html') {
                assert.equal(await page.evaluate(() => window.dialogVisible), false, 'native dialog closes after loads, saves, and failures');
                assert.equal(await page.evaluate(() => window.dialogOpens === window.dialogCloses), true);
                // OTC submits use the bound event even with PowerSchool's decorated ngSubmit.
                await page.locator('input[name="acetaminophen"][value="0"]').check();
                // The PowerSchool student shell scrolls content-main, not the window.
                await page.evaluate(() => {
                    const root = document.querySelector('.cdol-health-forms');
                    const panel = document.createElement('div');
                    panel.id = 'content-main';
                    panel.style.cssText = 'height:350px;overflow:auto';
                    root.parentNode.insertBefore(panel, root);
                    panel.appendChild(root);
                    document.querySelector('form button[type="submit"]').scrollIntoView();
                    window.scrollSamples = [];
                    panel.addEventListener('scroll', () => window.scrollSamples.push(panel.scrollTop));
                    window.initialPanelTop = panel.scrollTop;
                });
                assert.ok(await page.locator('#content-main').evaluate(panel => panel.scrollTop > 0));
                await page.locator('form button[type="submit"]').click();
                await page.waitForFunction(() => !window.mainVm.busy);
                await page.waitForFunction(() => document.querySelector('#content-main').scrollTop === 0, null, { timeout: 2000 });
                assert.equal(await page.evaluate(() => window.scrollSamples.filter(top => top > 0 && top < window.initialPanelTop).length > 5), true, 'scroll progresses through intermediate positions instead of jumping');
                assert.equal(await page.evaluate(() => window.studentData.acetaminophen), '0');
                assert.equal(await page.evaluate(() => window.mainVm.hasChanges()), false);
                assert.equal(await page.evaluate(() => window.dialogVisible), false);
            }
            if (process.env.HEALTH_FORM_SCREENSHOT_DIR) {
                await page.evaluate(() => {
                    const panel = document.querySelector('#content-main');
                    if (panel) panel.style.height = 'auto';
                });
                await page.screenshot({ path: path.join(process.env.HEALTH_FORM_SCREENSHOT_DIR, file + '.png'), fullPage: true });
            }
            console.log('PASS ' + file + (renderedNames ? ' (PowerSchool rendered names)' : ' (source names)') + ': initialization, dirty/reverted changes' + (file.startsWith('medical_') ? ', JSON load, changed-field API saves, read-back verification, blank values, failure handling, CRUD, independent audit, audit retry' : ', native submission, ten school branches, hidden-field preservation, read-only parent radio choices, native allergy field'));
            await page.close();
        }
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
