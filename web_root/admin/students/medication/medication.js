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
				// Load grid data once response is ready
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
			date_added: $rootScope.appData.curDate,
			users_dcid: $rootScope.appData.curUserDcid
		})

		const withInventoryDefaults = row => Object.assign(createInventoryRow(), row || {})

		const normalizeInventoryRows = () => {
			vm.inventoryRecord = [withInventoryDefaults((vm.inventoryRecord && vm.inventoryRecord[0]) || {})]
			vm.additionalInventoryRows = (vm.additionalInventoryRows || []).map(withInventoryDefaults)
		}

		const ensureFirstInventoryRowDefaults = () => {
			normalizeInventoryRows()
			vm.inventoryRecord[0].date_added = vm.inventoryRecord[0].date_added || $rootScope.appData.curDate
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
			dateKeys: ['_date'],
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
				// const complaintValues = Object.values($rootScope.appData.complaintList)

				// if (complaintValues.indexOf($scope.logRecord.complaint) === -1) {
				// 	// The complaint value does not exist in the complaintList
				// 	$scope.displayComplaintOther = true
				// 	$scope.logRecord.complaint_other = $scope.logRecord.complaint
				// 	$scope.logRecord.complaint = 'Other'
				// }
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
			delete medicationPayload.inventory
			formatService.objIterator(medicationPayload, formatKeys.dateKeys, 'formatDateForApi')
			// payload.inventory = [vm.inventoryRecord[0]].concat(vm.additionalInventoryRows)
			// //check for other values in dropdowns and takes the other value and puts it in the proper field in the logRecord also deletes the other field from the logRecord payload
			// for (const key in $scope.logRecord) {
			// 	if (key.endsWith('_other')) {
			// 		const originalKey = key.replace('_other', '')
			// 		if ($scope.logRecord[originalKey]) {
			// 			$scope.logRecord[originalKey] = $scope.logRecord[key]
			// 			delete $scope.logRecord[key]
			// 		}
			// 	}
			// }

			// //submitting staff changes through api
			let savePromise

			if (medicationPayload.medication_id) {
				let recordId = medicationPayload.medication_id
				delete medicationPayload['medication_id']
				delete medicationPayload['studentsdcid']
				// if (vm[recordKey].vitals) {
				// 	savePromise = psApiService.psApiCall('healthofficevisit', 'PUT', vm[recordKey], recordId)
				// } else {
				// 	delete $scope.logRecord['vitals']
				// }
				savePromise = psApiService.psApiCall('u_student_medication', 'PUT', medicationPayload, recordId)
			} else {
				// if (vm[recordKey].vitals) {
				// 	savePromise = psApiService.psApiCall('healthofficevisit', 'POST', vm[recordKey])
				// }
				// delete vm[recordKey]['vitals']
				savePromise = psApiService.psApiCall('u_student_medication', 'POST', medicationPayload)
			}

			return $q.when(savePromise).then(() => {
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
			// switch ($scope.logRecord.log_type) {
			// 	case 'Daily':
			// 		enableSaveButton = $scope.logRecord.complaint && $scope.logRecord.treatment && $scope.logRecord.users_dcid
			// 		break
			// 	case 'Athletic':
			// 		enableSaveButton = $scope.logRecord.treatment
			// 		break
			// 	case 'Concussion':
			// 		enableSaveButton = $scope.logRecord.users_dcid
			// 	case 'Injury':
			// 		enableSaveButton = $scope.logRecord.users_dcid
			// 		break
			// 	case 'Conversation':
			// 		enableSaveButton = $scope.logRecord.conversation_type && $scope.logRecord.contact && $scope.logRecord.users_dcid
			// 		break
			// }
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
		// $rootScope.loadData()
	})

	medicationModule.filter('pluralize', () => val => {
		if (!val) return val
		return val.slice(-1) === 's' ? val : val + 's'
	})
})
