define(['angular', 'components/shared/powerschoolModule'], angular => {
	'use strict'
	const medicationModule = angular.module('medicationModule', ['powerSchoolModule'])

	medicationModule.controller('medicationController', function ($scope, $rootScope, $attrs) {
		const vm = this
		$j(document).dblclick(() => console.log($scope))

		vm.appData = {
			context: $attrs.ngContext
		}
		$rootScope.appData = vm.appData
		vm.medicationList = []
		vm.filteredMedicationList = []

		$rootScope.loadData = () => {
			loadingDialog()
			vm[`${$rootScope.appData.context}List`] = []
			vm.medicationList = []
			vm.filteredMedicationList = []
		}

		$rootScope.reloadData = () => {
			$rootScope.seasonsList = []
			$rootScope.loadData()
		}
	})

	medicationModule.controller('editController', function ($scope, $rootScope, $attrs) {
		const vm = this
		const payloadKey = `${$rootScope.appData.context}Payload`
		vm[payloadKey] = {}

		const init = () => {
			$scope.$emit('open.drawer.event', openDrawer)
			$scope.$emit('cancel.drawer.event', cancelDrawer)
			$scope.$emit('save.drawer.event', saveDrawer)
		}

		const cancelDrawer = closeDrawer => {
			loadingDialog()
			$scope.resetForm(closeDrawer)
		}

		const openDrawer = (openCallBack, data) => {
			if (data.data.id == null) {
				// $scope.logRecord.log_type = $rootScope.appData.curContext
				// $scope.logRecord.log_date = $rootScope.appData.curDate
				// $scope.logRecord.log_time = $rootScope.appData.curTime
				// $scope.logRecord.users_dcid = $rootScope.appData.curUserDcid
			} else {
				// formatService.objIterator(data.data, formatKeys.dateKeys, 'formatDateFromApi')
				// formatService.objIterator(data.data, formatKeys.timeKeys, 'convSecondsToTime12')
				vm[payloadKey] = data.data
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

		let saveDrawer = async (closeDrawer, data) => {
			loadingDialog()

			// $scope.logRecord = Object.assign($scope.logRecord, commonPayload)
			// //add createFormatKeys to each object in submitPayload
			// $scope.logRecord = Object.assign($scope.logRecord, formatKeys)
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
			// if ($scope.logRecord.id) {
			// 	let recordId = $scope.logRecord.id
			// 	delete $scope.logRecord['id']
			// 	delete $scope.logRecord['studentsdcid']
			// 	if ($scope.logRecord.vitals) {
			// 		await psApiService.psApiCall('healthofficevisit', 'PUT', $scope.logRecord, recordId)
			// 	} else {
			// 		delete $scope.logRecord['vitals']
			// 	}
			// 	await psApiService.psApiCall('u_cdol_health_log', 'PUT', $scope.logRecord, recordId)
			// } else {
			// 	if ($scope.logRecord.vitals) {
			// 		await psApiService.psApiCall('healthofficevisit', 'POST', $scope.logRecord)
			// 	}
			// 	delete $scope.logRecord['vitals']
			// 	await psApiService.psApiCall('u_cdol_health_log', 'POST', $scope.logRecord)
			// }

			vm[payloadKey] = {}
			$rootScope.reloadData()
			closeLoading()
			closeDrawer(true)
		}
		// checks required fields and enables save button if all required fields are filled out
		vm.checkReqFields = () => {
			// let enableSaveButton = false
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
			// $scope.$emit(enableSaveButton ? 'drawer.enable.save.button' : 'drawer.disable.save.button')
		}

		vm.resetSeasonForm = closeDrawer => {
			vm[payloadKey] = {}
			$rootScope.reloadData()
			closeLoading()
			closeDrawer()
		}
		init()
	})
})
