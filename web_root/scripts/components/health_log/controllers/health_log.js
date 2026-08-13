'use strict'
define(function (require) {
	var module = require('components/health_log/module')
	var healthOptionConfig = require('components/health_log/config/healthOptions')
	var HEALTH_LOG_OPTION_TYPES = healthOptionConfig.healthLogTypes
	var ADD_HEALTH_OPTION_VALUE = '__ADD_HEALTH_OPTION_VALUE__'
	var isActiveHealthOption = record => !(
		record.isVisible === false || record.isVisible === 0 || record.isVisible === '0'
	)
	var sortHealthOptions = options => options.sort((left, right) => {
		const leftOrder = Number(left.uiDisplayOrder)
		const rightOrder = Number(right.uiDisplayOrder)
		if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder) && leftOrder !== rightOrder) return leftOrder - rightOrder
		if (Number.isFinite(leftOrder) && !Number.isFinite(rightOrder)) return -1
		if (!Number.isFinite(leftOrder) && Number.isFinite(rightOrder)) return 1
		return left.displayValue.localeCompare(right.displayValue)
	})

	module.controller('healthLogCtrl', [
		'$scope',
		'$rootScope',
		'$attrs',
		'jsonDataService',
		'psApiService',
		function ($scope, $rootScope, $attrs, jsonDataService, psApiService) {
			$j(document).dblclick(() => console.log($scope))

			$rootScope.getCurrentTime = () => {
				const now = new Date()
				let hours = now.getHours()
				const minutes = String(now.getMinutes()).padStart(2, '0')
				const meridiem = hours >= 12 ? 'PM' : 'AM'

				hours = hours % 12
				hours = hours === 0 ? 12 : hours
				const hourStr = String(hours).padStart(2, '0')

				return `${hourStr}:${minutes} ${meridiem}`
			}

			$scope.healthLogCounts = []
			$scope.healthLogList = []
			$rootScope.appData = {
				curSchoolId: $attrs.ngCurSchoolId,
				curYearId: $attrs.ngCurYearId,
				curStudentDCID: $attrs.ngCurStudentDcid,
				curStudentName: $attrs.ngCurStudentName,
				curUserDcid: $attrs.ngCurUserDcid,
				curDate: $attrs.ngCurDate,
				curTime: $rootScope.getCurrentTime(),
				curContext: $attrs.ngCurContext,
				healthOptions: {
					complaint: [],
					destination: [],
					conversation_type: []
				},
				healthOptionsAll: {
					complaint: [],
					destination: [],
					conversation_type: []
				},
				healthOptionsLoaded: false,
				healthOptionLoadError: '',
				treatmentList: {
					B: 'Controlled Bleeding',
					I: 'Ice Applied',
					M: 'Med Administration',
					W: 'Water/Snack',
					O: 'Other'
				}
			}
			const buildHealthLogOption = record => ({
				id: record.id,
				code: String(record.code || '').trim(),
				displayValue: String(record.displayValue || record.code || '').trim(),
				description: record.description,
				isActive: isActiveHealthOption(record),
				uiDisplayOrder: record.uiDisplayOrder
			})
			const addOtherOption = options => options.concat([{
				code: ADD_HEALTH_OPTION_VALUE,
				displayValue: 'Other',
				isAddNew: true,
				isActive: true
			}])
			const replaceHealthLogOptions = (fieldName, records) => {
				const uniqueOptions = []
				const seenCodes = new Set()
				sortHealthOptions(records.map(buildHealthLogOption)).forEach(option => {
					const identity = option.code.toLowerCase()
					if (!identity || seenCodes.has(identity)) return
					seenCodes.add(identity)
					uniqueOptions.push(option)
				})
				$rootScope.appData.healthOptionsAll[fieldName] = uniqueOptions
				$rootScope.appData.healthOptions[fieldName] = addOtherOption(
					uniqueOptions.filter(option => option.isActive)
				)
			}
			$rootScope.findHealthLogOption = (fieldName, value, activeOnly) => {
				const identity = String(value === undefined || value === null ? '' : value).trim().toLowerCase()
				if (!identity) return null
				return ($rootScope.appData.healthOptionsAll[fieldName] || []).find(option =>
					(!activeOnly || option.isActive) && (
						option.code.toLowerCase() === identity ||
						option.displayValue.toLowerCase() === identity
					)
				) || null
			}
			$rootScope.resolveHealthLogOptionValues = (fieldName, value, activeOnly) => {
				const originalValue = String(value === undefined || value === null ? '' : value).trim()
				if (!originalValue) return []

				const exactOption = $rootScope.findHealthLogOption(fieldName, originalValue, activeOnly)
				if (exactOption) return [exactOption]
				if (fieldName !== 'conversation_type' || originalValue.indexOf(',') === -1) return null

				const storedCodes = originalValue.split(',').map(code => code.trim()).filter(Boolean)
				if (storedCodes.length < 2) return null
				const resolvedOptions = storedCodes.map(code => $rootScope.findHealthLogOption(fieldName, code, activeOnly))
				return resolvedOptions.every(Boolean) ? resolvedOptions : null
			}
			$rootScope.healthOptionDisplayValue = (fieldName, value) => {
				const options = $rootScope.resolveHealthLogOptionValues(fieldName, value, false)
				return options && options.length ? options.map(option => option.displayValue).join(', ') : value
			}
			const decorateHealthLogOptionLabels = records => records.forEach(record => {
				record._complaint_display = $rootScope.healthOptionDisplayValue('complaint', record.complaint)
				record._destination_display = $rootScope.healthOptionDisplayValue('destination', record.destination)
				record._conversation_type_display = $rootScope.healthOptionDisplayValue('conversation_type', record.conversation_type)
			})
			$rootScope.addHealthLogOption = (fieldName, record) => {
				const normalizedRecord = healthOptionConfig.normalizeRecord(record)
				const existing = $rootScope.findHealthLogOption(fieldName, normalizedRecord.code, false) ||
					$rootScope.findHealthLogOption(fieldName, normalizedRecord.displayValue, false)
				if (existing) return existing
				const records = ($rootScope.appData.healthOptionsAll[fieldName] || []).concat([
					buildHealthLogOption(normalizedRecord)
				])
				replaceHealthLogOptionsFromBuilt(fieldName, records)
				return $rootScope.findHealthLogOption(fieldName, normalizedRecord.code, false)
			}
			const replaceHealthLogOptionsFromBuilt = (fieldName, options) => {
				const uniqueOptions = []
				const seenCodes = new Set()
				sortHealthOptions(options).forEach(option => {
					const identity = String(option.code || '').toLowerCase()
					if (!identity || seenCodes.has(identity)) return
					seenCodes.add(identity)
					uniqueOptions.push(option)
				})
				$rootScope.appData.healthOptionsAll[fieldName] = uniqueOptions
				$rootScope.appData.healthOptions[fieldName] = addOtherOption(uniqueOptions.filter(option => option.isActive))
			}
			const loadHealthOptions = () => psApiService.psApiCall('u_cdol_health_option', 'GET', {})
				.then(records => {
					$rootScope.appData.healthOptionLoadError = ''
					return records
				})
				.then(records => (Array.isArray(records) ? records : (records ? [records] : []))
					.map(healthOptionConfig.normalizeRecord))
				.then(records => {
					Object.keys(HEALTH_LOG_OPTION_TYPES).forEach(fieldName => {
						const definition = HEALTH_LOG_OPTION_TYPES[fieldName]
						replaceHealthLogOptions(fieldName, records.filter(record =>
							String(record.codeType || '').toLowerCase() === definition.codeType.toLowerCase() && record.code
						))
					})
					$rootScope.appData.healthOptionsLoaded = true
				})
				.catch(error => {
					$rootScope.appData.healthOptionLoadError = (error.data && error.data.message) ||
						'Health Log options could not be loaded. Try again or contact an administrator.'
					$rootScope.appData.healthOptionsLoaded = false
				})
			$scope.setfullContext = () => {
				const contextMap = {
					Daily: 'Daily Health Log',
					Athletic: 'Athletic Injury',
					Concussion: 'Concussion Evaluation',
					Eval: 'Injury Evaluation',
					Conversation: 'Conversation Log'
				}
				document.title = $rootScope.appData.fullContext = contextMap[$rootScope.appData.curContext] || 'Log'
				document.title = `${document.title} - ${$rootScope.appData.curStudentName}`
			}

			$rootScope.loadLogData = async logData => {
				loadingDialog()
				const requestParams = { curSchoolID: $rootScope.appData.curSchoolId, yearID: $rootScope.appData.curYearId, curStudentDCID: $rootScope.appData.curStudentDCID, logType: logData }
				await Promise.all([
					jsonDataService.getData('healthLogs', requestParams).then(records => { $scope.healthLogList = records }),
					jsonDataService.getData('staff', { curSchoolID: $rootScope.appData.curSchoolId }).then(records => { $rootScope.appData.staffList = records }),
					loadHealthOptions()
				])
				decorateHealthLogOptionLabels($scope.healthLogList)
				$scope.setfullContext()
				$scope.$digest()
				closeLoading()
			}

			$rootScope.reloadData = () => {
				$scope.healthLogCounts = []
				$scope.healthLogList = []
				$rootScope.loadLogData($scope.appData.curContext)
				$scope.$digest()
			}

			$scope.delConfirm = logId => {
				psConfirm({
					title: `Delete ${$rootScope.appData.fullContext}`,
					message: `    Are you sure you want to delete this ${$rootScope.appData.fullContext}?    `,
					oktext: 'Delete',
					canceltext: 'Cancel',
					ok: async () => {
						await psApiService.psApiCall('u_cdol_health_log', 'DELETE', {}, logId)
						await $rootScope.reloadData()
					}
				})
			}
		}
	])
	module.filter('convSecondsToTime12', function () {
		return function (psec) {
			if (psec === null || isNaN(psec)) {
				return '' // Return empty string for null or NaN inputs
			}
			let hours = Math.floor(psec / 3600)
			let minutes = Math.floor((psec - hours * 3600) / 60)
			let meridiem = 'AM'
			if (hours * 60 * 60 >= 43200) {
				meridiem = 'PM'
				if (hours !== 12) {
					hours -= 12
				}
			}
			hours = hours < 10 ? '0' + hours : hours
			minutes = minutes < 10 ? '0' + minutes : minutes
			let strTime = hours + ':' + minutes + ' ' + meridiem
			return strTime
		}
	})
})
