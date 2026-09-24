/* PowerSchool supplies AngularJS 1.4.7 through RequireJS. */
define(['angular', 'components/shared/index'], function (angular) {
    'use strict';
    var app = angular.module('cdolHealthForms', ['powerSchoolModule']);

    // PowerSchool decorates ngSubmit; bind directly so both API and native forms
    // run their controller handler regardless of that decorator's implementation.
    app.directive('healthSubmit', ['$parse', function ($parse) {
        return function (scope, element, attrs) {
            var submit = $parse(attrs.healthSubmit);
            function onSubmit(event) {
                var invoke = function () { submit(scope, { $event: event }); };
                if (scope.$root.$$phase) { invoke(); } else { scope.$apply(invoke); }
            }
            element.on('submit', onSubmit);
            scope.$on('$destroy', function () { element.off('submit', onSubmit); });
        };
    }]);

    app.factory('healthChangeTracking', function () {
        function normalize(value) {
            if (angular.isArray(value)) { return value.map(normalize); }
            return value === null || value === undefined ? '' : String(value).replace(/\r\n/g, '\n');
        }
        return {
            normalize: normalize,
            changed: function (current, original) { return !angular.equals(current, original); }
        };
    });

    // Seed ngModel from PowerSchool's rendered values before Angular renders the controls.
    // This also covers controls supplied by the state emergency include.
    app.directive('healthBoundForm', function () {
        function fieldKey(field) {
            if (field.name.charAt(0) === '[') { return field.name.toLowerCase(); }
            // PowerSchool replaces source names with record-specific EF-/UF- names.
            // Its validation key preserves the table/field identity. Generated
            // checkbox companion inputs have no key and must not seed ngModel.
            var validation;
            try { validation = JSON.parse(field.getAttribute('data-validation') || '{}'); }
            catch (error) { return ''; }
            var key = String(validation.key || '').toLowerCase();
            var separator = key.lastIndexOf('.');
            return separator > 0 ? '[' + key.slice(0, separator) + ']' + key.slice(separator + 1) : '';
        }
        return {
            priority: 100,
            compile: function (element) {
                angular.forEach(element[0].querySelectorAll('input[name], select[name], textarea[name]'), function (field) {
                    if (/^medLastUpdated/.test(field.id)) { return; }
                    var key = fieldKey(field);
                    if (!key) { return; }
                    var control = angular.element(field);
                    control.attr('ng-model', 'vm.values[' + JSON.stringify(key) + ']');
                    control.attr('health-initial-value', key);
                    var conditions = [];
                    var parent = field.parentNode;
                    while (parent && parent !== element[0]) {
                        if (parent.getAttribute && parent.getAttribute('health-when')) {
                            conditions.push('(' + parent.getAttribute('health-when') + ')');
                        }
                        parent = parent.parentNode;
                    }
                    if (conditions.length) {
                        var condition = conditions.join(' && ');
                        control.attr('health-field-condition', condition);
                        control.attr('ng-disabled', '!(' + condition + ')');
                        if (field.hasAttribute('required')) {
                            control.removeAttr('required');
                            control.attr('ng-required', condition);
                        }
                    }
                    if (field.type === 'checkbox') {
                        control.attr('ng-true-value', JSON.stringify(field.value || '1'));
                        control.attr('ng-false-value', "'0'");
                    }
                });
            }
        };
    });

    // Display the parent's answer without posting or modifying it.
    app.directive('healthParentReturn', function () {
        return {
            scope: { method: '@healthParentReturn' },
            template: '<div class="health-parent-return" role="radiogroup" aria-label="Parent\'s Stated Return Method" aria-disabled="true">' +
                '<label><input type="radio" value="Upload" ng-checked="method === \'Upload\'" disabled> Upload</label>' +
                '<label><input type="radio" value="Return to school office" ng-checked="method === \'Return to school office\'" disabled> Return to school office</label>' +
                '<span ng-if="!method">Not recorded</span>' +
                '<span ng-if="method && method !== \'Upload\' && method !== \'Return to school office\'" ng-bind="method"></span></div>'
        };
    });

    // Keep dependent controls in the DOM so their saved values can be initialized
    // and restored when a question is re-enabled. Hidden controls are not posted.
    app.directive('healthWhen', function () {
        return function (scope, element, attrs) {
            scope.$watch(attrs.healthWhen, function (visible) {
                element.toggleClass('ng-hide', !visible);
                element.attr('aria-hidden', visible ? 'false' : 'true');
            });
        };
    });

    app.directive('healthInitialValue', ['healthChangeTracking', function (tracking) {
        return {
            priority: 2,
            require: 'ngModel',
            compile: function () {
                return { pre: function (scope, element, attrs) {
                    var field = element[0];
                    var key = attrs.healthInitialValue;
                    if (attrs.healthFieldCondition) { scope.vm.fieldConditions[key] = attrs.healthFieldCondition; }
                    var value = field.type === 'checkbox' ? (field.checked ? (field.value || '1') : '0') : element.val();
                    if (field.type === 'radio' && !field.checked) {
                        if (scope.vm.values[key] !== undefined) { return; }
                        value = '';
                    }
                    scope.vm.values[key] = tracking.normalize(value);
                    scope.vm.original[key] = angular.copy(scope.vm.values[key]);
                }, post: function (scope, element, attrs, model) {
                    if (element[0].type === 'hidden') {
                        model.$render = function () { element.val(model.$viewValue || ''); };
                    }
                } };
            }
        };
    }]);

    app.factory('healthAudit', ['$http', '$q', function ($http, $q) {
        var fieldIds = ['medLastUpdatedUserType', 'medLastUpdatedBy', 'medLastUpdatedDate'];
        function values(root) {
            return ['Admin', root.getAttribute('data-audit-user'), root.getAttribute('data-audit-date')];
        }
        function stamp(root) {
            var data = values(root);
            angular.forEach(fieldIds, function (id, i) { root.querySelector('#' + id).value = data[i]; });
        }
        return {
            stamp: stamp,
            save: function (root) {
                var data = values(root);
                var body = ['ac=prim'];
                angular.forEach(fieldIds, function (id, i) {
                    body.push(encodeURIComponent(root.querySelector('#' + id).name) + '=' + encodeURIComponent(data[i]));
                });
                var url = root.querySelector('form').action.replace('changesSaved=true', 'healthAuditSaved=true');
                return $http.post(url, body.join('&'), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    transformResponse: angular.identity
                }).then(function (response) {
                    // A login/error page can return HTTP 200. Verify the saved server values.
                    var document = new DOMParser().parseFromString(response.data, 'text/html');
                    var receipt = document.getElementById('healthAuditReceipt');
                    if (!receipt || receipt.getAttribute('data-user') !== data[1] ||
                            receipt.getAttribute('data-date') !== data[2] || receipt.getAttribute('data-type') !== 'Admin') {
                        return $q.reject(new Error('Audit stamp could not be verified.'));
                    }
                    stamp(root);
                    return 'Last Updated by Admin: ' + data[1] + ' - ' + data[2];
                });
            }
        };
    }]);

    app.controller('healthFormController', ['$element', '$scope', 'healthChangeTracking', 'healthAudit', function ($element, $scope, tracking, audit) {
        var vm = this;
        vm.values = {};
        vm.original = {};
        vm.fieldConditions = {};
        vm.message = '';
        vm.formSchool = $element[0].getAttribute('data-form-school') || '';
        vm.currentSchool = $element[0].getAttribute('data-current-school') || '';
        vm.answer = function (field) { return vm.values['[students.u_student_additional_info]' + field.toLowerCase()] || ''; };
        vm.show = function (section) {
            var yes = function (field) { return vm.answer(field) === '1'; };
            var school = String(vm.formSchool);
            switch (section) {
            case 'dentalAgreement': return school === '120';
            case 'dentalPlan': return school === '104';
            case 'diabetesPlan': return school.indexOf('101') === -1 && yes('diabetes');
            case 'actionPlan': return yes('diabetes') || yes('seizure_agree');
            case 'seizurePlan': return ['130', '131'].indexOf(school) !== -1 && yes('seizure_agree');
            case 'asthmaAllergyPlan': return yes('inhaler') || yes('epipen');
            case 'inhalerContract': return school === '311' && yes('inhaler');
            case 'medicalCareNotice': return ['210', '211'].indexOf(school) !== -1 && (yes('inhaler') || yes('epipen'));
            case 'allergies': return yes('allergy_agree');
            case 'mealPlan': return yes('allergy_agree') && ['110', '130', '131'].indexOf(school) !== -1;
            case 'mealPlanInstructions': return yes('allergy_agree') && ['130', '131'].indexOf(school) !== -1;
            case 'sportsAccommodations': return vm.answer('can_play_sports').toLowerCase() === 'yes - with accommodations';
            case 'restrictedActivities': return vm.answer('can_play_sports') === '0' || vm.show('sportsAccommodations');
            default: return false;
            }
        };
        vm.hasChanges = function () {
            var current = {}, original = {};
            angular.forEach(vm.values, function (value, key) {
                if (!vm.fieldConditions[key] || $scope.$eval(vm.fieldConditions[key])) {
                    current[key] = value;
                    original[key] = vm.original[key];
                }
            });
            return tracking.changed(current, original);
        };
        vm.submit = function (event) {
            if (vm.medicationBlocked || (vm.form && vm.form.$invalid)) {
                event.preventDefault();
                vm.message = vm.medicationBlocked ? 'Finish the prescription medication change first.' : 'Review the highlighted fields before submitting.';
                return;
            }
            if (!vm.hasChanges()) {
                event.preventDefault();
                vm.message = 'There are no changes to submit.';
                return;
            }
            audit.stamp($element[0]);
            vm.message = '';
        };
    }]);

    app.factory('medicalAuthorizationApi', ['$http', '$q', function ($http, $q) {
        var fields = ['med_share_consent', 'med_first_aid_consent', 'hospital_consent',
            'acetaminophen', 'ibuprofen', 'antihistamine', 'antacid', 'antibiotic', 'hydrocortisone', 'cough_drop'];
        function flag(value) {
            if (value === null || value === undefined || value === '') { return ''; }
            if (value === true || value === 1 || value === '1' || value === 'true') { return '1'; }
            if (value === false || value === 0 || value === '0' || value === 'false') { return '0'; }
            throw new Error('An authorization has an unsupported saved value.');
        }
        function load(context) {
            return $http.get('/admin/students/health/data/medicalAuthorization.json', {
                params: { frn: context.frn, studentDcid: context.dcid }, cache: false
            }).then(function (response) {
                var rows = typeof psUtils !== 'undefined' && psUtils.htmlEntitiesToCharCode ?
                    psUtils.htmlEntitiesToCharCode(response.data) : response.data;
                if (typeof rows === 'string') { rows = JSON.parse(rows); }
                if (!angular.isArray(rows) || rows.length !== 1 || String(rows[0].student_dcid) !== context.dcid ||
                        !/^[01]$/.test(String(rows[0].record_exists)) || !/^\d{4}-\d{2}-\d{2}$/.test(rows[0].today || '')) {
                    throw new Error('The student authorization response could not be verified.');
                }
                var record = rows[0], values = {};
                fields.forEach(function (field) {
                    if (!Object.prototype.hasOwnProperty.call(record, field)) { throw new Error('Missing authorization field.'); }
                    values[field] = flag(record[field]);
                });
                return { record: record, values: values };
            });
        }
        return {
            fields: fields,
            load: load,
            save: function (context, record, changes) {
                var payload = {};
                fields.forEach(function (field) {
                    if (Object.prototype.hasOwnProperty.call(changes, field)) {
                        var value = flag(changes[field]);
                        if (value === '') { throw new Error('Choose Yes or No before saving.'); }
                        // Schema Boolean fields use true/false; Hospital Consent is String(100).
                        payload[field] = field === 'hospital_consent' ? value : (value === '1' ? 'true' : 'false');
                    }
                });
                payload.med_last_updated_user_type = 'Admin';
                payload.med_last_updated_by = context.user;
                payload.med_last_updated_date = record.today;
                var exists = String(record.record_exists) === '1';
                if (!exists) { payload.studentsdcid = context.dcid; }
                return $http({
                    method: exists ? 'PUT' : 'POST',
                    url: '/ws/schema/table/u_student_additional_info' + (exists ? '/' + encodeURIComponent(context.dcid) : ''),
                    data: { tables: { u_student_additional_info: payload } }
                }).then(function (response) {
                    var result = response.data && response.data.result;
                    if (!angular.isArray(result) || !result.length || !result.every(function (row) {
                        return !row.error_message && (row.status === 'SUCCESS' || Boolean(row.success_message));
                    })) { return $q.reject(new Error('PowerSchool did not confirm the authorization save.')); }
                    return load(context).then(function (saved) {
                        if (String(saved.record.record_exists) !== '1' || saved.record.audit_name !== payload.med_last_updated_by ||
                                saved.record.audit_user_type !== 'Admin' || saved.record.audit_date !== payload.med_last_updated_date ||
                                Object.keys(changes).some(function (field) { return saved.values[field] !== changes[field]; })) {
                            throw new Error('The saved authorizations could not be verified.');
                        }
                        return saved;
                    });
                });
            }
        };
    }]);

    app.controller('medicalAuthorizationController', ['$element', '$scope', '$q', '$timeout', '$window', 'medicalAuthorizationApi', function ($element, $scope, $q, $timeout, $window, api) {
        var vm = this, root = $element[0];
        var context = { dcid: root.getAttribute('data-student-dcid'), frn: root.getAttribute('data-student-frn'),
            user: root.getAttribute('data-audit-user') };
        vm.appData = {};
        vm.original = {};
        vm.record = {};
        vm.loaded = false;
        vm.busy = false;
        vm.initializing = true;
        vm.prescriptionBusy = true;
        vm.message = '';
        var dialogOpen = false;
        $scope.$watch(function () { return vm.busy || vm.prescriptionBusy; }, function (busy) {
            if (busy && !dialogOpen) { loadingDialog(); dialogOpen = true; }
            if (!busy) {
                vm.initializing = false;
                if (dialogOpen) { closeLoading(); dialogOpen = false; }
            }
        });
        $scope.$on('$destroy', function () { if (dialogOpen) { closeLoading(); } });
        vm.hasParentSignature = function () {
            var name = vm.record.parent_name;
            return typeof name === 'string' && name.trim() !== '' && name.trim().toLowerCase() !== 'null';
        };
        function changedValues() {
            var changes = {};
            api.fields.forEach(function (field) {
                if (vm.appData[field] !== vm.original[field]) { changes[field] = vm.appData[field]; }
            });
            return changes;
        }
        function accept(saved) {
            vm.record = saved.record;
            vm.appData = saved.values;
            vm.original = angular.copy(saved.values);
            vm.loaded = true;
            if (vm.form) { vm.form.$setPristine(); vm.form.$setUntouched(); }
        }
        vm.hasChanges = function () { return vm.loaded && Object.keys(changedValues()).length > 0; };
        vm.load = function () {
            if (vm.busy) { return; }
            vm.busy = true; vm.loaded = false; vm.initializing = true; vm.message = '';
            return api.load(context).then(accept, function () {
                vm.error = true;
                vm.message = 'Medical authorizations could not be loaded. Retry loading before making changes.';
            }).finally(function () { vm.busy = false; });
        };
        vm.submit = function (event) {
            if (event) { event.preventDefault(); }
            if (!vm.loaded || vm.busy || vm.medicationBlocked || !vm.hasChanges() || (vm.form && vm.form.$invalid)) { return; }
            vm.busy = true; vm.message = '';
            return api.save(context, vm.record, changedValues()).then(function (saved) {
                accept(saved);
                vm.error = false; vm.message = 'Medical authorizations saved.';
                // Wait for the loading dialog to close before scrolling to the confirmation.
                $timeout(function () { $window.scrollTo(0, 0); }, 0, false);
            }, function () {
                vm.loaded = false; vm.error = true;
                vm.message = 'The save could not be verified. Reload the saved values before making another change.';
            }).finally(function () { vm.busy = false; });
        };
        // Prescription changes stamp only audit fields and preserve unsaved consent edits.
        vm.saveAudit = function () {
            if (vm.busy) { return $q.reject(new Error('Authorizations are busy.')); }
            vm.busy = true;
            // Re-read first: a previous audit request may have saved despite a lost response.
            return api.load(context).then(function (saved) {
                return api.save(context, saved.record, {});
            }).then(function (saved) {
                vm.record = saved.record;
                return saved.record.last_updated_message;
            }).finally(function () { vm.busy = false; });
        };
        vm.load();
    }]);

    app.factory('prescriptionApi', ['$http', '$q', function ($http, $q) {
        function unwrap(data, table) {
            if (data && data.tables && data.tables[table] !== undefined) {
                var rows = data.tables[table];
                return angular.isArray(rows) ? rows : (rows ? [rows] : []);
            }
            var records = data && (data.record || data.result) || [];
            return (angular.isArray(records) ? records : [records]).map(function (row) {
                return row && row.tables && row.tables[table];
            }).filter(Boolean);
        }
        function loadOptions(page) {
            return $http.get('/ws/schema/table/u_cdol_health_option', { params: { projection: '*', pagesize: 100, page: page } }).then(function (response) {
                var rows = unwrap(response.data, 'u_cdol_health_option');
                return rows.length < 100 ? rows : loadOptions(page + 1).then(function (next) { return rows.concat(next); });
            });
        }
        return {
            options: function () {
                return loadOptions(1).then(function (rows) {
                    var seen = {};
                    return rows.map(function (row) {
                        return {
                            type: row.codeType || row.codetype,
                            code: String(row.code || '').trim(),
                            label: row.displayValue || row.displayvalue || row.code,
                            active: row.isVisible !== undefined ? row.isVisible : row.isvisible,
                            order: Number(row.uiDisplayOrder !== undefined ? row.uiDisplayOrder : row.uidisplayorder) || 0
                        };
                    }).filter(function (row) {
                        var key = row.code.toLowerCase();
                        if (String(row.type).toUpperCase() !== 'MED_DOSE_UNIT' || !key || row.active === false || String(row.active) === '0' || seen[key]) { return false; }
                        seen[key] = true;
                        return true;
                    }).sort(function (a, b) { return a.order - b.order || String(a.label).localeCompare(String(b.label)); });
                });
            },
            list: function (studentDcid) {
                return $http.post('/ws/schema/query/net.cdolinc.studentinfo.prescription.medications?pagesize=0', { studentsDCID: studentDcid }).then(function (response) {
                    var data = response.data;
                    if (data && angular.isArray(data.record)) { return data.record; }
                    // A zero-row PowerQuery returns only its core-table metadata.
                    // Accept that known envelope, but never treat a login/error response as empty.
                    if (data && data.name === 'students' && typeof data['@extensions'] === 'string' &&
                            Object.keys(data).every(function (key) { return key === 'name' || key === '@extensions'; })) {
                        return [];
                    }
                    return $q.reject(new Error('Invalid medication response.'));
                });
            },
            write: function (method, id, record) {
                return $http({
                    method: method,
                    url: '/ws/schema/table/u_fb_medications' + (id ? '/' + encodeURIComponent(id) : ''),
                    data: method === 'DELETE' ? undefined : { tables: { u_fb_medications: record } }
                }).then(function (response) {
                    var result = response.data && response.data.result;
                    if ((result && result.length && result.every(function (row) { return row.status === 'SUCCESS'; })) ||
                            response.data === '' || response.data === null || response.status === 204) { return; }
                    return $q.reject(new Error('PowerSchool did not confirm the medication change.'));
                });
            }
        };
    }]);

    app.controller('prescriptionController', ['$scope', '$element', '$q', 'prescriptionApi', 'healthAudit', function ($scope, $element, $q, api, audit) {
        var rx = this;
        var root = $element[0].parentNode;
        var vm = $scope.vm;
        var studentDcid = root.getAttribute('data-student-dcid');
        rx.rows = [];
        rx.units = [];
        rx.busy = true;
        rx.loaded = false;
        rx.feedback = '';
        rx.auditPending = false;
        function feedback(message, error) { rx.feedback = message; rx.error = Boolean(error); }
        function belongs(row) { return row && String(row.studentsdcid) === String(studentDcid); }
        function block() {
            vm.medicationBlocked = rx.busy || Boolean(rx.editor) || rx.auditPending;
            vm.prescriptionBusy = rx.busy;
        }
        function findUnit(value) {
            var key = String(value || '').trim().toLowerCase();
            return rx.units.filter(function (unit) { return unit.code.toLowerCase() === key || String(unit.label).toLowerCase() === key; })[0];
        }
        rx.unitLabel = function (value) { var unit = findUnit(value); return unit ? unit.label : value; };
        function normalized(row) {
            var unit = findUnit(row.dosage_units);
            return {
                name: String(row.name || '').trim(),
                dosage: String(row.dosage === null || row.dosage === undefined ? '' : row.dosage).trim(),
                dosage_units: unit ? unit.code : '',
                frequency_taken: String(row.frequency_taken || '').trim()
            };
        }
        rx.changed = function () { return rx.editor && (!rx.editingId || !angular.equals(normalized(rx.editor), rx.original)); };
        rx.valid = function () {
            if (!rx.editor) { return false; }
            var row = normalized(rx.editor);
            return Boolean(row.name && row.dosage && row.dosage_units && row.frequency_taken);
        };
        rx.edit = function (row) {
            if (vm.busy || vm.loaded === false || rx.busy || rx.editor || rx.auditPending || !rx.loaded || !rx.units.length || (row && !belongs(row))) { return; }
            rx.editingId = row ? String(row.medication_id) : null;
            rx.editor = normalized(row || {});
            rx.original = angular.copy(rx.editor);
            rx.originalUnit = row && row.dosage_units;
            feedback('');
            block();
        };
        rx.cancel = function () {
            if (rx.busy) { return; }
            rx.editor = null;
            rx.editingId = null;
            if (rx.editorForm) { rx.editorForm.$setPristine(); rx.editorForm.$setUntouched(); }
            block();
        };
        function reload() {
            return api.list(studentDcid).then(function (rows) {
                rx.rows = rows.filter(belongs);
                rx.loaded = true;
            }, function () {
                rx.loaded = false;
                feedback('Prescription medications could not be loaded. Reload the page to try again.', true);
            });
        }
        function saveAudit(message) {
            return (vm.saveAudit ? vm.saveAudit() : audit.save(root)).then(function (text) {
                rx.auditPending = false;
                var banner = root.querySelector('#medicalLastUpdated');
                if (banner && !vm.saveAudit) { banner.textContent = text; banner.style.fontStyle = 'italic'; }
                feedback(message);
            }, function () {
                rx.auditPending = true;
                feedback('The medication change was saved, but the audit stamp could not be verified. Retry the audit stamp before continuing.', true);
            });
        }
        rx.retryAudit = function () {
            if (rx.busy || !rx.auditPending) { return; }
            rx.busy = true; block();
            saveAudit('Medical audit stamp updated.').finally(function () { rx.busy = false; block(); });
        };
        function write(method, id, data, message) {
            rx.busy = true; block();
            return api.write(method, id, data).then(function () {
                rx.editor = null;
                rx.editingId = null;
                if (rx.editorForm) { rx.editorForm.$setPristine(); rx.editorForm.$setUntouched(); }
                return saveAudit(message).then(reload);
            }, function () {
                feedback('The medication change could not be confirmed. Reload the list before retrying to avoid a duplicate record.', true);
                rx.loaded = false;
            }).finally(function () { rx.busy = false; block(); });
        }
        rx.save = function () {
            if (vm.busy || vm.loaded === false || rx.busy || !rx.valid() || !rx.changed() || !rx.loaded || rx.auditPending) { return; }
            var data = normalized(rx.editor);
            if (rx.editingId && !rx.rows.some(function (row) { return String(row.medication_id) === rx.editingId && belongs(row); })) { return; }
            if (!rx.editingId) { data.studentsdcid = studentDcid; }
            return write(rx.editingId ? 'PUT' : 'POST', rx.editingId, data, rx.editingId ? 'Prescription medication updated.' : 'Prescription medication added.');
        };
        rx.remove = function (row) {
            if (vm.busy || vm.loaded === false || rx.busy || rx.editor || rx.auditPending || !rx.loaded || !belongs(row)) { return; }
            psConfirm({
                title: 'Delete Prescription Medication',
                message: 'Delete this prescription medication? This action cannot be undone.',
                oktext: 'Delete', canceltext: 'Cancel',
                ok: function () { $scope.$evalAsync(function () {
                    if (!vm.busy && vm.loaded !== false && !rx.busy && !rx.editor && !rx.auditPending && rx.loaded) {
                        write('DELETE', row.medication_id, null, 'Prescription medication deleted.');
                    }
                }); }
            });
        };
        rx.keydown = function (event) {
            if (event.keyCode === 13) { event.preventDefault(); rx.save(); }
            if (event.keyCode === 27) { event.preventDefault(); rx.cancel(); }
        };
        block();
        $q.all([reload(), api.options().then(function (units) {
            rx.units = units;
            if (!units.length) { feedback('No active Medication Dose Units are configured in CDOL Health Code Sets.', true); }
        }, function () { feedback('Medication Dose Units could not be loaded. Adding and editing are unavailable.', true); })]).finally(function () { rx.busy = false; block(); });
    }]);
    return app;
});
