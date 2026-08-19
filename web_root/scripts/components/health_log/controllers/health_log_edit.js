'use strict'
define(function (require) {
	let module = require('components/health_log/module')
	let healthOptionConfig = require('components/health_log/config/healthOptions')
	const HEALTH_LOG_OPTION_TYPES = healthOptionConfig.healthLogTypes
	const ADD_HEALTH_OPTION_VALUE = '__ADD_HEALTH_OPTION_VALUE__'

	module.controller('healthLogEditCtrl', [
		'$scope',
		'$rootScope',
		'psApiService',
		'formatService',
		function ($scope, $rootScope, psApiService, formatService) {
			$j(document).dblclick(() => console.log($scope))
			$scope.toggleSection = $event => {
				if ($event.charCode === 13 || $event.charCode === 32) {
					$event.currentTarget.click()
				}
			}

			$scope.setLeftTimeToNow = () => {
				if (typeof $rootScope.getCurrentTime === 'function') {
					$scope.logRecord.left_time = $rootScope.getCurrentTime()
				}
			}

			$scope.logRecord = {}
			$scope.healthOptionSelections = {}
			$scope.healthOptionStates = {}
			$scope.healthOptionEditors = {}
			const resetHealthOptionEditor = fieldName => {
				$scope.healthOptionEditors[fieldName] = {
					visible: false,
					value: '',
					error: '',
					saving: false,
					similarOption: null
				}
			}
			const resetHealthOptionFields = () => {
				Object.keys(HEALTH_LOG_OPTION_TYPES).forEach(fieldName => {
					$scope.healthOptionSelections[fieldName] = fieldName === 'conversation_type' ? [] : ''
					$scope.healthOptionStates[fieldName] = {
						isExisting: false,
						readOnly: false,
						displayValue: '',
						originalValue: '',
						changed: false,
						lastSelection: ''
					}
					resetHealthOptionEditor(fieldName)
				})
			}
			const prepareHealthOptionField = (fieldName, isExisting) => {
				const originalValue = $scope.logRecord[fieldName]
				const state = $scope.healthOptionStates[fieldName]
				state.isExisting = isExisting
				state.originalValue = originalValue === undefined || originalValue === null ? '' : originalValue
				state.changed = false
				state.readOnly = false
				state.displayValue = ''
				state.lastSelection = ''
				$scope.healthOptionSelections[fieldName] = fieldName === 'conversation_type' ? [] : ''

				if (!state.originalValue) return

				const matchingOptions = typeof $rootScope.resolveHealthLogOptionValues === 'function'
					? $rootScope.resolveHealthLogOptionValues(fieldName, state.originalValue, false)
					: null
				if (isExisting && (!matchingOptions || matchingOptions.some(option => !option.isActive))) {
					state.readOnly = true
					state.displayValue = matchingOptions && matchingOptions.length
						? matchingOptions.map(option => option.displayValue).join(', ')
						: state.originalValue
					return
				}
				if (matchingOptions && matchingOptions.length && matchingOptions.every(option => option.isActive)) {
					if (fieldName === 'conversation_type') {
						$scope.healthOptionSelections[fieldName] = matchingOptions.map(option => option.code)
					} else {
						$scope.healthOptionSelections[fieldName] = matchingOptions[0].code
						state.lastSelection = matchingOptions[0].code
					}
					return
				}

				// New records cannot retain an arbitrary value that is not an Active option.
				$scope.logRecord[fieldName] = ''
			}
			const prepareHealthOptionFields = isExisting => {
				resetHealthOptionFields()
				Object.keys(HEALTH_LOG_OPTION_TYPES).forEach(fieldName => prepareHealthOptionField(fieldName, isExisting))
			}
			const selectedHealthOptionValue = fieldName => {
				const state = $scope.healthOptionStates[fieldName]
				if (!state) return ''
				if (state.readOnly || (state.isExisting && !state.changed)) return state.originalValue
				if (fieldName === 'conversation_type') {
					const selections = $scope.healthOptionSelections[fieldName] || []
					return ($rootScope.appData.healthOptionsAll[fieldName] || [])
						.filter(option => option.isActive && selections.indexOf(option.code) !== -1)
						.map(option => option.code)
						.join(',')
				}
				return $scope.healthOptionSelections[fieldName]
			}
			const healthOptionFieldIsValid = fieldName => {
				const state = $scope.healthOptionStates[fieldName]
				const editor = $scope.healthOptionEditors[fieldName]
				if (editor && (editor.visible || editor.saving)) return false
				if (state && state.readOnly) return Boolean(state.originalValue)
				if (!$rootScope.appData.healthOptionsLoaded) return false
				const value = selectedHealthOptionValue(fieldName)
				const matchingOptions = $rootScope.resolveHealthLogOptionValues(fieldName, value, true)
				return Boolean(value && matchingOptions && matchingOptions.length)
			}
			const applyHealthOptionSelections = () => {
				Object.keys(HEALTH_LOG_OPTION_TYPES).forEach(fieldName => {
					const value = selectedHealthOptionValue(fieldName)
					if (value) $scope.logRecord[fieldName] = value
					else delete $scope.logRecord[fieldName]
				})
			}
			const commonPayload = {
				schoolid: $rootScope.appData.curSchoolId,
				yearid: $rootScope.appData.curYearId,
				studentsdcid: $rootScope.appData.curStudentDCID
			}
			const formatKeys = {
				dateKeys: ['_date'],
				timeKeys: ['_time'],
				deleteKeys: ['_title', '_name', '_display']
			}

			let init = () => {
				$scope.$emit('open.drawer.event', openDrawer)
				$scope.$emit('cancel.drawer.event', cancelDrawer)
				$scope.$emit('save.drawer.event', saveDrawer)
			}

			$scope.$on('after.open.drawer.event', event => {
				// Check for vital signs fields and toggle the section if necessary
				if ($scope.logRecord.temperature || $scope.logRecord.respiratoryrate || $scope.logRecord.pulserate || $scope.logRecord.oxygensaturation || $scope.logRecord.bloodpressuresystolic || $scope.logRecord.bloodpressurediastolic || $scope.logRecord.bloodsugar) {
					const vitalsignsHeader = document.getElementById('vitalsigns-h2')
					if (vitalsignsHeader && vitalsignsHeader.classList.contains('collapsed')) {
						vitalsignsHeader.click() // Simulate a click to open the section
					}
				}
			})

			let openDrawer = (openCallBack, data) => {
				$scope.logRecord = {}
				resetHealthOptionFields()
				if (data.data.id == null) {
					if ($rootScope.appData.curContext !== 'Concussion' && $rootScope.appData.curContext !== 'Eval') {
						$scope.$emit('drawer.disable.save.button')
					}
					$scope.logRecord.log_type = $rootScope.appData.curContext
					$scope.logRecord.log_date = $rootScope.appData.curDate
					$scope.logRecord.log_time = $rootScope.appData.curTime
					$scope.logRecord.users_dcid = $rootScope.appData.curUserDcid
					$scope.logRecord.injury_date = ['Concussion', 'Eval'].includes($scope.logRecord.log_type) ? $rootScope.appData.curDate : $scope.logRecord.injury_date
					prepareHealthOptionFields(false)
				} else {
					formatService.objIterator(data.data, formatKeys.dateKeys, 'formatDateFromApi')
					formatService.objIterator(data.data, formatKeys.timeKeys, 'convSecondsToTime12')
					$scope.logRecord = data.data
					prepareHealthOptionFields(true)
				}

				$scope.checkReqFields()
				openCallBack()
			}

			let cancelDrawer = closeDrawer => {
				loadingDialog()
				$scope.logRecord = {}
				$rootScope.reloadData()
				closeLoading()
				closeDrawer(true)
				closeDrawer()
			}

			let saveDrawer = async (closeDrawer, data) => {
				loadingDialog()

				applyHealthOptionSelections()
				$scope.logRecord = Object.assign($scope.logRecord, commonPayload)
				//add createFormatKeys to each object in submitPayload
				$scope.logRecord = Object.assign($scope.logRecord, formatKeys)
				//submitting staff changes through api
				if ($scope.logRecord.id) {
					let recordId = $scope.logRecord.id
					delete $scope.logRecord['id']
					delete $scope.logRecord['studentsdcid']
					if ($scope.logRecord.vitals) {
						await psApiService.psApiCall('healthofficevisit', 'PUT', $scope.logRecord, recordId)
					} else {
						delete $scope.logRecord['vitals']
					}
					await psApiService.psApiCall('u_cdol_health_log', 'PUT', $scope.logRecord, recordId)
				} else {
					if ($scope.logRecord.vitals) {
						await psApiService.psApiCall('healthofficevisit', 'POST', $scope.logRecord)
					}
					delete $scope.logRecord['vitals']
					await psApiService.psApiCall('u_cdol_health_log', 'POST', $scope.logRecord)
				}

				$scope.logRecord = {}
				$rootScope.reloadData()
				closeLoading()
				closeDrawer(true)
			}
			// checks required fields and enables save button if all required fields are filled out
			$scope.checkReqFields = () => {
				let enableSaveButton = false
				switch ($scope.logRecord.log_type) {
					case 'Daily':
						enableSaveButton = healthOptionFieldIsValid('complaint') && $scope.logRecord.treatment && $scope.logRecord.users_dcid
						break
					case 'Athletic':
						enableSaveButton = $scope.logRecord.treatment
						break
					case 'Concussion':
						enableSaveButton = $scope.logRecord.users_dcid
					case 'Injury':
						enableSaveButton = $scope.logRecord.users_dcid
						break
					case 'Conversation':
						enableSaveButton = healthOptionFieldIsValid('conversation_type') && $scope.logRecord.contact && $scope.logRecord.users_dcid
						break
				}
				if (Object.keys($scope.healthOptionEditors).some(fieldName => {
					const editor = $scope.healthOptionEditors[fieldName]
					return editor.visible || editor.saving
				})) enableSaveButton = false

				$scope.$emit(enableSaveButton ? 'drawer.enable.save.button' : 'drawer.disable.save.button')
			}
			$scope.onHealthOptionSelectionChanged = fieldName => {
				const selectedValue = $scope.healthOptionSelections[fieldName]
				const state = $scope.healthOptionStates[fieldName]
				if (selectedValue === ADD_HEALTH_OPTION_VALUE) {
					$scope.healthOptionSelections[fieldName] = state.lastSelection
					resetHealthOptionEditor(fieldName)
					$scope.healthOptionEditors[fieldName].visible = true
				} else {
					resetHealthOptionEditor(fieldName)
					state.changed = true
					state.lastSelection = selectedValue
				}
				$scope.checkReqFields()
			}
			$scope.activeConversationOptions = () => ($rootScope.appData.healthOptions.conversation_type || [])
				.filter(option => !option.isAddNew)
			$scope.isConversationMethodSelected = code => ($scope.healthOptionSelections.conversation_type || [])
				.indexOf(code) !== -1
			$scope.toggleConversationMethod = code => {
				const selections = $scope.healthOptionSelections.conversation_type || []
				const selectedIndex = selections.indexOf(code)
				if (selectedIndex === -1) selections.push(code)
				else selections.splice(selectedIndex, 1)
				$scope.healthOptionSelections.conversation_type = selections
				$scope.healthOptionStates.conversation_type.changed = true
				$scope.checkReqFields()
			}
			$scope.openHealthOptionValue = fieldName => {
				resetHealthOptionEditor(fieldName)
				$scope.healthOptionEditors[fieldName].visible = true
				$scope.checkReqFields()
			}
			$scope.normalizeHealthOptionInput = fieldName => {
				const editor = $scope.healthOptionEditors[fieldName]
				editor.value = healthOptionConfig.normalizeDisplayValue(editor.value)
				$scope.updateHealthOptionSimilarity(fieldName)
			}
			$scope.updateHealthOptionSimilarity = fieldName => {
				const editor = $scope.healthOptionEditors[fieldName]
				const existingOptions = $rootScope.appData.healthOptionsAll[fieldName] || []
				editor.similarOption = healthOptionConfig.findSimilarOption(editor.value, existingOptions)
			}
			$scope.cancelHealthOptionValue = fieldName => {
				if (fieldName !== 'conversation_type') {
					$scope.healthOptionSelections[fieldName] = $scope.healthOptionStates[fieldName].lastSelection
				}
				resetHealthOptionEditor(fieldName)
				$scope.checkReqFields()
			}
			const selectAddedHealthOption = (fieldName, code) => {
				if (fieldName === 'conversation_type') {
					const selections = $scope.healthOptionSelections[fieldName] || []
					if (selections.indexOf(code) === -1) selections.push(code)
					$scope.healthOptionSelections[fieldName] = selections
				} else {
					$scope.healthOptionSelections[fieldName] = code
					$scope.healthOptionStates[fieldName].lastSelection = code
				}
				$scope.healthOptionStates[fieldName].changed = true
			}
			$scope.addHealthOptionValue = fieldName => {
				const editor = $scope.healthOptionEditors[fieldName]
				const displayValue = healthOptionConfig.normalizeDisplayValue(editor.value)
				const code = healthOptionConfig.buildCodeForType(
					HEALTH_LOG_OPTION_TYPES[fieldName].codeType,
					displayValue
				)
				editor.value = displayValue
				editor.error = ''
				$scope.updateHealthOptionSimilarity(fieldName)

				if (!displayValue) {
					editor.error = 'Enter a reusable option to add.'
					return
				}
				if (displayValue.length > healthOptionConfig.displayValueMaxLength) {
					editor.error = `The value must be ${healthOptionConfig.displayValueMaxLength} characters or fewer.`
					return
				}
				if (!code || code.length > healthOptionConfig.codeMaxLength) {
					editor.error = `Shorten the value so its lowercase code is ${healthOptionConfig.codeMaxLength} characters or fewer.`
					return
				}

				const existingByCode = $rootScope.findHealthLogOption(fieldName, code, false)
				const existingByDisplay = $rootScope.findHealthLogOption(fieldName, displayValue, false)
				const existingOption = existingByCode || existingByDisplay
				if (existingOption) {
					if (!existingOption.isActive) {
						editor.error = 'This option already exists but is Inactive. Ask a district administrator to reactivate it.'
						return
					}
					selectAddedHealthOption(fieldName, existingOption.code)
					resetHealthOptionEditor(fieldName)
					$scope.checkReqFields()
					return
				}

				const existingOptions = $rootScope.appData.healthOptionsAll[fieldName] || []
				const displayOrder = existingOptions.reduce((highestOrder, option) => {
					const optionOrder = Number(option.uiDisplayOrder)
					return Number.isFinite(optionOrder) ? Math.max(highestOrder, optionOrder) : highestOrder
				}, 0) + 10
				const payload = {
					codetype: HEALTH_LOG_OPTION_TYPES[fieldName].codeType,
					code,
					displayvalue: displayValue,
					description: displayValue,
					isvisible: 1,
					uidisplayorder: displayOrder
				}

				editor.saving = true
				$scope.checkReqFields()
				return psApiService.psApiCall('u_cdol_health_option', 'POST', payload)
					.then(() => {
						const option = $rootScope.addHealthLogOption(fieldName, payload)
						selectAddedHealthOption(fieldName, option.code)
						resetHealthOptionEditor(fieldName)
					})
					.catch(error => {
						editor.error = (error.data && error.data.message) ||
							'PowerSchool could not add this Health Log option. Try again or contact an administrator.'
						editor.saving = false
					})
					.finally(() => $scope.checkReqFields())
			}

			resetHealthOptionFields()
			init()
		}
	])
})
