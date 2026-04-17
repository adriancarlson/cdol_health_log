define(['angular', 'components/shared/powerschoolModule', 'components/health_log/module', 'components/health_log/services/formatService', 'components/health_log/services/psApiService'], angular => {
	'use strict'
	const medicationModule = angular.module('medicationModule', ['powerSchoolModule', 'healthLogMod'])

	medicationModule.controller('medicationController', function ($scope, $rootScope, $attrs, $http) {
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
			districtUser: $attrs.ngCurUserSecurityRoles && $attrs.ngCurUserSecurityRoles.split(',').includes('9'),
			isTestServer: $attrs.ngServerName && $attrs.ngServerName.indexOf('.test.') !== -1,
			unitList: { mg: 'Milligrams (MG)', ml: 'Milliliters (ML)', units: 'Units', pills: 'Pills', other: 'Other' },
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

			$http({
				url: `./data/${$rootScope.appData.context}.json`,
				method: 'GET',
				params: paramValues
			}).then(res => {
				const resData = Array.isArray(res?.data) ? res.data : []
				// Load grid data once response is ready
				const sanitizedData = psUtils.htmlEntitiesToCharCode(resData)
				vm[`${$rootScope.appData.context}List`] = sanitizedData
				closeLoading()
			})
		}

		$rootScope.reloadData = () => {
			vm[`${$rootScope.appData.context}List`] = []
			$rootScope.loadData()
		}
		$rootScope.loadData()
	})

	medicationModule.controller('editController', function ($scope, $rootScope, $q, formatService, psApiService) {
		const vm = this
		const recordKey = `${$rootScope.appData.context}Record`
		vm[recordKey] = {}

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
			$rootScope.reloadData()
			closeLoading()
			closeDrawer(true)
			closeDrawer()
		}

		const openDrawer = (openCallBack, data) => {
			if (data.data.id == null) {
				vm[recordKey].created_date = $rootScope.appData.curDate
				vm[recordKey].created_by_users_dcid = $rootScope.appData.curUserDcid
				vm[recordKey].studentsdcid = $rootScope.appData.curStudentDCID
				vm[recordKey].schoolid = $rootScope.appData.curSchoolId
				vm[recordKey].yearid = $rootScope.appData.curYearId
			} else {
				// formatService.objIterator(data.data, formatKeys.dateKeys, 'formatDateFromApi')
				// formatService.objIterator(data.data, formatKeys.timeKeys, 'convSecondsToTime12')
				vm[recordKey] = data.data
				// const complaintValues = Object.values($rootScope.appData.complaintList)

				// if (complaintValues.indexOf($scope.logRecord.complaint) === -1) {
				// 	// The complaint value does not exist in the complaintList
				// 	$scope.displayComplaintOther = true
				// 	$scope.logRecord.complaint_other = $scope.logRecord.complaint
				// 	$scope.logRecord.complaint = 'Other'
				// }
			}
			openCallBack()
		}

		const saveDrawer = (closeDrawer, data) => {
			loadingDialog()

			// //add createFormatKeys to each object in submitPayload
			vm[recordKey] = Object.assign(vm[recordKey], formatKeys)
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

			if (vm[recordKey].id) {
				let recordId = vm[recordKey].id
				delete vm[recordKey]['id']
				delete vm[recordKey]['studentsdcid']
				// if (vm[recordKey].vitals) {
				// 	savePromise = psApiService.psApiCall('healthofficevisit', 'PUT', vm[recordKey], recordId)
				// } else {
				// 	delete $scope.logRecord['vitals']
				// }
				savePromise = psApiService.psApiCall('u_student_medication', 'PUT', vm[recordKey], recordId)
			} else {
				// if (vm[recordKey].vitals) {
				// 	savePromise = psApiService.psApiCall('healthofficevisit', 'POST', vm[recordKey])
				// }
				// delete vm[recordKey]['vitals']
				savePromise = psApiService.psApiCall('u_student_medication', 'POST', vm[recordKey])
			}

			return $q.when(savePromise).then(() => {
				vm[recordKey] = {}
				$rootScope.reloadData()
				closeLoading()
				closeDrawer(true)
			})
		}
		// checks required fields and enables save button if all required fields are filled out
		vm.checkReqFields = () => {
			let enableSaveButton = false
			// enableSaveButton = vm[recordKey].medication_name && vm[recordKey].created_date && vm[recordKey].dose_amount && vm[recordKey].dose_unit && vm[recordKey].route && vm[recordKey].frequency
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
			$rootScope.reloadData()
			closeLoading()
			closeDrawer()
		}
		initalizeDrawer()
		// $rootScope.loadData()
	})
})
