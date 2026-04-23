define(['angular', 'components/shared/powerschoolModule', 'components/health_log/module', 'components/health_log/services/formatService', 'components/health_log/services/pqService', 'components/health_log/services/psApiService'], angular => {
	'use strict'
	const medicationModule = angular.module('medicationModule', ['powerSchoolModule', 'healthLogMod'])

	medicationModule.controller('medicationController', function ($scope, $rootScope, $attrs, $http, $q, pqService, psApiService) {
		const vm = this
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

		vm.appData = {
			context: $attrs.ngContext,
			contextTitle: $attrs.ngContext.charAt(0).toUpperCase() + $attrs.ngContext.slice(1),
			curSchoolId: $attrs.ngCurSchoolId,
			curYearId: $attrs.ngCurYearId,
			curStudentDCID: $attrs.ngCurStudentDcid,
			curStudentName: $attrs.ngCurStudentName,
			curUserDcid: $attrs.ngCurUserDcid,
			curDate: $attrs.ngCurDate,
			curTime: $rootScope.getCurrentTime(),
			districtUser: $attrs.ngCurUserSecurityRoles && ($attrs.ngCurUserSecurityRoles.split(',').includes('9') || $attrs.ngCurUserSecurityRoles.split(',').includes('6')),
			isTestServer: $attrs.ngServerName && $attrs.ngServerName.indexOf('.test.') !== -1,
			unitList: { mg: 'Milligrams (MG)', ml: 'Milliliters (ML)', units: 'Units', pills: 'Pills', other: 'Other' },
			inventoryUnitList: {
				Pill: 'Pill',
				Tablet: 'Tablet',
				Capsule: 'Capsule',
				'Milliliters (ML)': 'Milliliters (ML)',
				Units: 'Units',
				Other: 'Other'
			},
			routeList: { oral: 'Oral', nasal: 'Nasal', sublingual: 'Sublingual', subcutaneous: 'Subcutaneous', rectal: 'Rectal', other: 'Other' },
			frequencyList: { daily: 'Daily', other: 'Other' }
		}

		$rootScope.appData = vm.appData

		$rootScope.loadData = () => {
			loadingDialog()
			const paramValues = {
				curStudentDCID: vm.appData.curStudentDCID,
				curSchoolID: vm.appData.curSchoolId,
				yearID: vm.appData.curYearId
			}

			vm[`${$rootScope.appData.context}List`] = []

			const staffPromise = $q.when(pqService.getPQResults('net.cdolinc.health.healthLog.staff', { curSchoolID: paramValues.curSchoolID })).then(staffList => {
				$rootScope.appData.staffList = staffList
			})

			const dataPromise = $http({
				url: `./data/${$rootScope.appData.context}.json`,
				method: 'GET',
				params: paramValues
			}).then(res => {
				const resData = Array.isArray(res?.data) ? res.data : []
				const sanitizedData = psUtils.htmlEntitiesToCharCode(resData)
				vm[`${$rootScope.appData.context}List`] = sanitizedData
			})

			$q.all([staffPromise, dataPromise]).finally(() => {
				closeLoading()
			})
		}

		$rootScope.reloadData = () => {
			vm[`${$rootScope.appData.context}List`] = []
			$rootScope.loadData()
		}

		vm.delConfirm = logId => {
			console.log(logId)
			psConfirm({
				title: `Delete ${$rootScope.appData.contextTitle} Item`,
				message: `    Are you sure you want to delete this ${$rootScope.appData.contextTitle} Item?    `,
				oktext: 'Delete',
				canceltext: 'Cancel',
				ok: () => {
					$q.when(psApiService.psApiCall('u_student_medication', 'DELETE', {}, logId)).then(() => {
						$rootScope.reloadData()
					})
				}
			})
		}

		$rootScope.loadData()
	})

	medicationModule.controller('editController', function ($scope, $rootScope, $q, $timeout, formatService, psApiService) {
		const vm = this
		const recordKey = `${$rootScope.appData.context}Record`
		vm[recordKey] = {}
		vm.medicationRecord = vm[recordKey]
		const createInventoryRow = () => ({
			added_date: $rootScope.appData.curDate,
			users_dcid: $rootScope.appData.curUserDcid
		})

		const withInventoryDefaults = row => Object.assign(createInventoryRow(), row || {})

		const normalizeInventoryRows = () => {
			vm.inventoryRecord = [withInventoryDefaults((vm.inventoryRecord && vm.inventoryRecord[0]) || {})]
			vm.additionalInventoryRows = (vm.additionalInventoryRows || []).map(withInventoryDefaults)
		}

		const ensureFirstInventoryRowDefaults = () => {
			normalizeInventoryRows()
			vm.inventoryRecord[0].added_date = vm.inventoryRecord[0].added_date || $rootScope.appData.curDate
			vm.inventoryRecord[0].users_dcid = vm.inventoryRecord[0].users_dcid || $rootScope.appData.curUserDcid
		}

		const resetInventoryRows = () => {
			vm.inventoryRecord = [createInventoryRow()]
			vm.additionalInventoryRows = []
			ensureFirstInventoryRowDefaults()
		}
		resetInventoryRows()

		vm.hasExistingInventory = () => Boolean(vm[recordKey] && vm[recordKey].medication_id)

		vm.addInventoryRecord = () => {
			vm.additionalInventoryRows.push(createInventoryRow())
			ensureFirstInventoryRowDefaults()
			vm.checkReqFields()
		}

		$scope.$watch(
			() => vm.medicationRecord,
			() => {
				vm.checkReqFields()
			},
			true
		)

		const initalizeDrawer = () => {
			$scope.$emit('open.drawer.event', openDrawer)
			$scope.$emit('cancel.drawer.event', cancelDrawer)
			$scope.$emit('save.drawer.event', saveDrawer)
		}

		const formatKeys = {
			dateKeys: ['_date', 'added_date'],
			timeKeys: ['_time']
		}

		const cancelDrawer = closeDrawer => {
			loadingDialog()
			vm[recordKey] = {}
			vm.medicationRecord = vm[recordKey]
			resetInventoryRows()
			$rootScope.reloadData()
			closeLoading()
			closeDrawer(true)
			closeDrawer()
		}

		const openDrawer = (openCallBack, data) => {
			$scope.$emit('drawer.enable.save.button')
			console.log(data.data)
			if (data.data.medication_id == null) {
				const record = vm.medicationRecord || vm[recordKey] || {}
				resetInventoryRows()
				ensureFirstInventoryRowDefaults()
				delete record.inventory
				record.created_date = $rootScope.appData.curDate
				record.users_dcid = $rootScope.appData.curUserDcid
				record.studentsdcid = $rootScope.appData.curStudentDCID
				record.schoolid = $rootScope.appData.curSchoolId
				record.yearid = $rootScope.appData.curYearId
				vm[recordKey] = record
				vm.medicationRecord = record
			} else {
				formatService.objIterator(data.data, formatKeys.dateKeys, 'stripTimeFromIsoDate')
				formatService.objIterator(data.data, formatKeys.dateKeys, 'formatDateFromApi')
				// formatService.objIterator(data.data, formatKeys.timeKeys, 'convSecondsToTime12')
				resetInventoryRows()
				ensureFirstInventoryRowDefaults()
				delete data.data.inventory
				vm[recordKey] = data.data
				vm.medicationRecord = vm[recordKey]
			}
			vm.checkReqFields()
			openCallBack()
			$timeout(() => {
				ensureFirstInventoryRowDefaults()
				vm.checkReqFields()
			})
		}

		const saveDrawer = (closeDrawer, data) => {
			loadingDialog()

			const medicationPayload = Object.assign({}, vm.medicationRecord || vm[recordKey] || {})
			const existingMedicationId = medicationPayload.medication_id || null
			delete medicationPayload.inventory
			formatService.objIterator(medicationPayload, formatKeys.dateKeys, 'formatDateForApi')

			const getMedicationIdFromResponse = response => {
				if (!response) return null

				if (Array.isArray(response)) {
					const first = response[0] || {}
					return (first.success_message && first.success_message.id) || first.id || null
				}

				if (response.result && response.result[0] && response.result[0].success_message && response.result[0].success_message.id) {
					return response.result[0].success_message.id
				}

				if (response.success_message && response.success_message.id) return response.success_message.id
				if (response.id) return response.id
				return null
			}

			const buildInventoryPayloads = medicationId => {
				const inventoryRows = [vm.inventoryRecord[0]].concat(vm.additionalInventoryRows || [])
				return inventoryRows
					.filter(row => row && row.quantity_added !== undefined && row.quantity_added !== null && row.quantity_added !== '')
					.map(row => {
						const inventoryPayload = {
							u_student_medication_id: medicationId,
							added_date: row.added_date,
							users_dcid: row.users_dcid,
							quantity_added: row.quantity_added,
							quantity_remaining: row.quantity_added,
							notes: row.notes
						}
						return inventoryPayload
					})
			}

			const normalizeInventoryDatesForApi = payloads => {
				return (payloads || []).map(payload => {
					const normalized = Object.assign({}, payload)
					const value = normalized.added_date

					if (value && typeof value === 'string') {
						if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
							normalized.added_date = formatService.formatDateForApi(value)
						}
					} else if (value) {
						normalized.added_date = formatService.formatDateForApi(value)
					}

					return normalized
				})
			}

			let savePromise

			if (existingMedicationId) {
				let recordId = existingMedicationId
				delete medicationPayload['medication_id']
				delete medicationPayload['studentsdcid']

				savePromise = psApiService.psApiCall('u_student_medication', 'PUT', medicationPayload, recordId)
			} else {
				savePromise = psApiService.psApiCall('u_student_medication', 'POST', medicationPayload)
			}

			return $q
				.when(savePromise)
				.then(response => {
					console.log('save response', response)
					console.log('save promise', savePromise)

					const medicationId = existingMedicationId || getMedicationIdFromResponse(response)
					const inventoryPayloads = buildInventoryPayloads(medicationId)
					const inventoryPayloadsForApi = normalizeInventoryDatesForApi(inventoryPayloads)
					console.log('inventory payloads', inventoryPayloads)
					console.log('inventory post debug', { medicationId, inventoryPayloads: inventoryPayloadsForApi })

					if (medicationId && inventoryPayloadsForApi.length) {
						return $q.all(inventoryPayloadsForApi.map(payload => psApiService.psApiCall('u_student_medication_inventory', 'POST', payload)))
					}

					console.warn('Inventory submit skipped', {
						medicationId,
						inventoryRecord: vm.inventoryRecord,
						additionalInventoryRows: vm.additionalInventoryRows
					})
					return null
				})
				.then(() => {
					vm[recordKey] = {}
					vm.medicationRecord = vm[recordKey]
					resetInventoryRows()
					$rootScope.reloadData()
					closeLoading()
					closeDrawer(true)
				})
		}
		// checks required fields and enables save button if all required fields are filled out
		vm.checkReqFields = () => {
			const record = vm.medicationRecord || vm[recordKey] || {}
			const enableSaveButton = record.medication_name && record.created_date && record.dose_amount && record.dose_unit && record.inventory_unit && record.route && record.frequency

			$scope.$emit(enableSaveButton ? 'drawer.enable.save.button' : 'drawer.disable.save.button')
		}

		vm.resetSeasonForm = closeDrawer => {
			vm[recordKey] = {}
			vm.medicationRecord = vm[recordKey]
			resetInventoryRows()
			$rootScope.reloadData()
			closeLoading()
			closeDrawer()
		}
		initalizeDrawer()
	})

	medicationModule.filter('pluralize', () => val => {
		if (!val) return val
		return val.slice(-1) === 's' ? val : val + 's'
	})
})
