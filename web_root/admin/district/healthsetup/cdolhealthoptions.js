define([
	'angular',
	'components/health_log/config/healthOptions',
	'components/shared/powerschoolModule',
	'components/health_log/module',
	'components/health_log/services/formatService',
	'components/health_log/services/psApiService'
], (angular, healthOptionConfig) => {
	'use strict'
	const healthOptionsAdminModule = angular.module('healthOptionsAdminModule', ['powerSchoolModule', 'healthLogMod'])
	const isVisible = value => !(value === false || value === 0 || value === '0')
	const normalizeIdentity = value => healthOptionConfig.normalizeDisplayValue(value).toLowerCase()
	const sortHealthOptions = options => options.slice().sort((left, right) => {
		const orderDifference = (Number(left.uiDisplayOrder) || 0) - (Number(right.uiDisplayOrder) || 0)
		return orderDifference || String(left.displayValue).localeCompare(String(right.displayValue))
	})

	healthOptionsAdminModule.controller('healthOptionsController', function ($scope, $rootScope, $http, $q, $timeout, psApiService) {
		const vm = this
		let feedbackTimeout
		vm.appData = {
			optionTypes: healthOptionConfig.optionTypes,
			selectedCodeType: '',
			showInactive: false
		}
		vm.options = []
		vm.allSelectedOptions = []
		vm.selectedOptions = []
		vm.inactiveOptionCount = 0
		vm.feedback = ''
		vm.reordering = false
		$rootScope.healthOptionsAppData = vm.appData
		$rootScope.healthOptionList = vm.options

		vm.selectedCodeSetName = () => {
			const selectedType = vm.appData.optionTypes.find(optionType => optionType.codeType === vm.appData.selectedCodeType)
			return selectedType ? selectedType.displayName : ''
		}
		vm.refreshSelectedOptions = () => {
			const categoryOptions = vm.options.filter(option => option.codeType === vm.appData.selectedCodeType)
			const activeOptions = sortHealthOptions(categoryOptions.filter(option => isVisible(option.isVisible)))
			const inactiveOptions = sortHealthOptions(categoryOptions.filter(option => !isVisible(option.isVisible)))
			vm.inactiveOptionCount = inactiveOptions.length
			vm.allSelectedOptions = activeOptions.concat(inactiveOptions)
			vm.selectedOptions = vm.appData.showInactive
				? vm.allSelectedOptions
				: activeOptions
		}
		vm.canMoveOption = (option, direction) => {
			if (vm.reordering || (direction !== -1 && direction !== 1)) return false
			const optionIsActive = isVisible(option.isVisible)
			const statusOptions = vm.allSelectedOptions.filter(candidate => isVisible(candidate.isVisible) === optionIsActive)
			const currentIndex = statusOptions.findIndex(candidate => Number(candidate.id) === Number(option.id))
			const targetIndex = currentIndex + direction
			return currentIndex >= 0 && targetIndex >= 0 && targetIndex < statusOptions.length
		}
		$rootScope.getNextHealthOptionOrder = codeType => {
			const currentOrders = vm.options
				.filter(option => option.codeType === codeType)
				.map(option => Number(option.uiDisplayOrder))
				.filter(Number.isFinite)
			return currentOrders.length ? Math.max(...currentOrders) + 10 : 10
		}
		$rootScope.showHealthOptionsFeedback = message => {
			if (feedbackTimeout) $timeout.cancel(feedbackTimeout)
			vm.feedback = message
			feedbackTimeout = $timeout(() => {
				vm.feedback = ''
				feedbackTimeout = null
			}, 5000)
		}
		const saveOptionOrder = (reorderedOptions, feedbackMessage) => {
			const updates = reorderedOptions
				.map((record, index) => ({ record, order: (index + 1) * 10 }))
				.filter(update => Number(update.record.uiDisplayOrder) !== update.order)

			if (!updates.length) {
				$rootScope.showHealthOptionsFeedback(feedbackMessage)
				return $q.when()
			}

			vm.reordering = true
			loadingDialog()
			return $q.all(updates.map(update =>
				psApiService.psApiCall('u_cdol_health_option', 'PUT', {
					uidisplayorder: update.order
				}, update.record.id)
			))
				.then(() => $rootScope.reloadHealthOptions(true))
				.then(() => $rootScope.showHealthOptionsFeedback(feedbackMessage))
				.finally(() => {
					vm.reordering = false
					closeLoading()
				})
		}
		vm.moveOption = (option, direction) => {
			if (!vm.canMoveOption(option, direction)) return
			const optionIsActive = isVisible(option.isVisible)
			const activeOptions = vm.allSelectedOptions.filter(candidate => isVisible(candidate.isVisible))
			const inactiveOptions = vm.allSelectedOptions.filter(candidate => !isVisible(candidate.isVisible))
			const statusOptions = (optionIsActive ? activeOptions : inactiveOptions).slice()
			const currentIndex = statusOptions.findIndex(candidate => Number(candidate.id) === Number(option.id))
			const targetIndex = currentIndex + direction
			const movedOption = statusOptions.splice(currentIndex, 1)[0]
			statusOptions.splice(targetIndex, 0, movedOption)
			const reorderedOptions = optionIsActive
				? statusOptions.concat(inactiveOptions)
				: activeOptions.concat(statusOptions)
			return saveOptionOrder(reorderedOptions, 'Display order updated.')
		}
		vm.canSortSelectedOptions = () => Boolean(
			!vm.reordering && vm.appData.selectedCodeType && vm.allSelectedOptions.length > 1
		)
		vm.sortSelectedOptionsAlphabetically = () => {
			if (!vm.canSortSelectedOptions()) return
			const sortAlphabetically = options => options.slice().sort((left, right) => {
				const leftLabel = String(left.displayValue || '').toLowerCase()
				const rightLabel = String(right.displayValue || '').toLowerCase()
				return leftLabel.localeCompare(rightLabel) || Number(left.id) - Number(right.id)
			})
			const activeOptions = sortAlphabetically(
				vm.allSelectedOptions.filter(option => isVisible(option.isVisible))
			)
			const inactiveOptions = sortAlphabetically(
				vm.allSelectedOptions.filter(option => !isVisible(option.isVisible))
			)
			return saveOptionOrder(
				activeOptions.concat(inactiveOptions),
				`${vm.selectedCodeSetName()} sorted alphabetically.`
			)
		}
		$rootScope.reloadHealthOptions = skipLoadingDialog => {
			if (!skipLoadingDialog) loadingDialog()
			const usageRequest = $http.get('./data/healthOptionUsage.json')
				.then(response => response.data)
				.catch(error => {
					console.error('Unable to load health option usage counts.', error)
					return null
				})
			return $q.all([
				psApiService.psApiCall('u_cdol_health_option', 'GET', {}),
				usageRequest
			])
				.then(results => {
					const records = results[0]
					let usageRecords = results[1]
					if (usageRecords !== null && usageRecords !== undefined &&
						typeof psUtils !== 'undefined' && psUtils.htmlEntitiesToCharCode) {
						usageRecords = psUtils.htmlEntitiesToCharCode(usageRecords)
					}
					if (typeof usageRecords === 'string') {
						const usageJson = usageRecords.trim()
						try {
							usageRecords = usageJson ? JSON.parse(usageJson) : null
						} catch (error) {
							console.error('Unable to parse health option usage counts.', error)
							usageRecords = null
						}
					}
					const usageCountsAvailable = usageRecords !== null && usageRecords !== undefined
					if (usageCountsAvailable && !Array.isArray(usageRecords)) usageRecords = [usageRecords]
					const usageByOptionId = (usageRecords || []).reduce((usageMap, usageRecord) => {
						usageMap[String(usageRecord.id)] = Number(usageRecord.usage_count) || 0
						return usageMap
					}, {})
					vm.options = (Array.isArray(records) ? records : (records ? [records] : []))
						.map(healthOptionConfig.normalizeRecord)
						.map(option => Object.assign(option, {
							usageCount: usageCountsAvailable ? (usageByOptionId[String(option.id)] || 0) : '\u2014'
						}))
					$rootScope.healthOptionList = vm.options
					vm.refreshSelectedOptions()
				})
				.finally(() => {
					if (!skipLoadingDialog) closeLoading()
				})
		}

		$rootScope.reloadHealthOptions()
	})

	healthOptionsAdminModule.controller('healthOptionEditController', function ($scope, $rootScope, psApiService) {
		const vm = this
		vm.optionRecord = {}
		vm.originalOptionRecord = null
		vm.isEditMode = false
		vm.similarOptionRecord = null

		const hasValue = value => value !== undefined && value !== null && String(value).trim() !== ''
		const findDuplicate = () => {
			const displayIdentity = normalizeIdentity(vm.optionRecord.displayValue)
			const codeIdentity = String(vm.optionRecord.code || '').trim().toLowerCase()
			return ($rootScope.healthOptionList || []).find(option => {
				if (vm.optionRecord.id && Number(option.id) === Number(vm.optionRecord.id)) return false
				if (option.codeType !== vm.optionRecord.codeType) return false
				return normalizeIdentity(option.displayValue) === displayIdentity ||
					String(option.code || '').trim().toLowerCase() === codeIdentity
			})
		}
		const findSimilarOption = () => {
			if (vm.isEditMode || !hasValue(vm.optionRecord.displayValue)) return null
			const categoryOptions = ($rootScope.healthOptionList || []).filter(option =>
				option.codeType === vm.optionRecord.codeType
			)
			return healthOptionConfig.findSimilarOption(vm.optionRecord.displayValue, categoryOptions)
		}
		vm.updateSimilarOption = () => {
			vm.similarOptionRecord = findSimilarOption()
		}

		vm.codeSetName = () => {
			const optionType = ($rootScope.healthOptionsAppData.optionTypes || [])
				.find(type => type.codeType === vm.optionRecord.codeType)
			return optionType ? optionType.displayName : vm.optionRecord.codeType
		}
		vm.updateGeneratedCode = () => {
			if (!vm.isEditMode) {
				vm.optionRecord.code = healthOptionConfig.buildCodeForType(
					vm.optionRecord.codeType,
					vm.optionRecord.displayValue
				)
			}
			vm.updateSimilarOption()
			vm.checkReqFields()
		}
		vm.conversationCodeHasComma = () => vm.optionRecord.codeType === 'HEALTH_CONVERSATION' &&
			String(vm.optionRecord.code || '').indexOf(',') !== -1
		vm.normalizeDisplayValue = () => {
			vm.optionRecord.displayValue = healthOptionConfig.normalizeDisplayValue(vm.optionRecord.displayValue)
			vm.optionRecord.description = vm.optionRecord.displayValue
			vm.updateGeneratedCode()
		}
		vm.duplicateOptionExists = () => {
			if (!hasValue(vm.optionRecord.displayValue) || !hasValue(vm.optionRecord.code)) return false
			if (!vm.isEditMode) return Boolean(findDuplicate())

			const originalDisplayIdentity = normalizeIdentity(vm.originalOptionRecord && vm.originalOptionRecord.displayValue)
			const originalCodeIdentity = String(vm.originalOptionRecord && vm.originalOptionRecord.code || '').trim().toLowerCase()
			const displayIdentity = normalizeIdentity(vm.optionRecord.displayValue)
			const codeIdentity = String(vm.optionRecord.code || '').trim().toLowerCase()
			const otherOptions = ($rootScope.healthOptionList || []).filter(option =>
				Number(option.id) !== Number(vm.optionRecord.id) && option.codeType === vm.optionRecord.codeType
			)
			const changedDisplayIsDuplicate = displayIdentity !== originalDisplayIdentity && otherOptions.some(option =>
				normalizeIdentity(option.displayValue) === displayIdentity
			)
			const changedCodeIsDuplicate = codeIdentity !== originalCodeIdentity && otherOptions.some(option =>
				String(option.code || '').trim().toLowerCase() === codeIdentity
			)
			return changedDisplayIsDuplicate || changedCodeIsDuplicate
		}
		vm.isFormValid = () => {
			const displayValue = healthOptionConfig.normalizeDisplayValue(vm.optionRecord.displayValue)
			const code = String(vm.optionRecord.code || '').trim()
			return Boolean(
				vm.optionRecord.codeType &&
				displayValue &&
				displayValue.length <= healthOptionConfig.displayValueMaxLength &&
				code &&
				code.length <= healthOptionConfig.codeMaxLength &&
				!vm.conversationCodeHasComma() &&
				!vm.duplicateOptionExists()
			)
		}
		vm.checkReqFields = () => {
			$scope.$emit(vm.isFormValid() ? 'drawer.enable.save.button' : 'drawer.disable.save.button')
		}

		const openDrawer = (openCallback, data) => {
			const drawerData = (data && data.data) || {}
			const sourceOption = drawerData.option
			vm.isEditMode = Boolean(sourceOption && sourceOption.id)
			if (vm.isEditMode) {
				vm.originalOptionRecord = Object.assign({}, sourceOption)
				vm.optionRecord = Object.assign({}, sourceOption, {
					isVisible: isVisible(sourceOption.isVisible)
				})
			} else {
				vm.originalOptionRecord = null
				const codeType = drawerData.codeType || $rootScope.healthOptionsAppData.selectedCodeType
				vm.optionRecord = {
					codeType,
					displayValue: '',
					description: '',
					code: '',
					uiDisplayOrder: $rootScope.getNextHealthOptionOrder(codeType),
					isVisible: true
				}
			}
			vm.updateSimilarOption()
			vm.checkReqFields()
			openCallback()
		}
		const cancelDrawer = closeDrawer => closeDrawer()
		const saveDrawer = closeDrawer => {
			if (!vm.isFormValid()) return
			vm.normalizeDisplayValue()
			const payload = {
				codetype: vm.optionRecord.codeType,
				code: vm.optionRecord.code,
				displayvalue: vm.optionRecord.displayValue,
				description: vm.optionRecord.displayValue,
				isvisible: vm.optionRecord.isVisible ? 1 : 0,
				uidisplayorder: Number(vm.optionRecord.uiDisplayOrder)
			}
			let savePromise
			loadingDialog()
			if (vm.isEditMode) {
				savePromise = psApiService.psApiCall('u_cdol_health_option', 'PUT', payload, vm.optionRecord.id)
			} else {
				savePromise = psApiService.psApiCall('u_cdol_health_option', 'POST', payload)
			}

			return savePromise
				.then(() => $rootScope.reloadHealthOptions(true))
				.then(() => {
					$rootScope.showHealthOptionsFeedback(`${vm.optionRecord.displayValue} saved.`)
					closeDrawer(true)
				})
				.finally(() => closeLoading())
		}

		$scope.$emit('open.drawer.event', openDrawer)
		$scope.$emit('cancel.drawer.event', cancelDrawer)
		$scope.$emit('save.drawer.event', saveDrawer)
		$scope.$watch(() => vm.optionRecord, () => vm.checkReqFields(), true)
	})
})
