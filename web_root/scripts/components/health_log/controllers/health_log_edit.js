'use strict'
define(function (require) {
	let module = require('components/health_log/module')

	module.controller('healthLogEditCtrl', [
		'$scope',
		'$rootScope',
		'psApiService',
		'formatService',
		function ($scope, $rootScope, psApiService, formatService) {
			$scope.toggleSection = function ($event) {
				if ($event.charCode === 13 || $event.charCode === 32) {
					$event.currentTarget.click()
				}
			}

			$scope.logRecord = {}
			const commonPayload = {
				schoolid: $rootScope.appData.curSchoolId,
				yearid: $rootScope.appData.curYearId,
				studentsdcid: $rootScope.appData.curStudentDCID
			}
			const formatKeys = {
				dateKeys: ['_date'],
				timeKeys: ['_time'],
				deleteKeys: ['_title', '_name']
			}

			let init = () => {
				$scope.$emit('open.drawer.event', openDrawer)
				$scope.$emit('cancel.drawer.event', cancelDrawer)
				$scope.$emit('save.drawer.event', saveDrawer)
			}

			let openDrawer = (openCallBack, data) => {
				if (data.data.id == null) {
					if ($rootScope.appData.curContext !== 'Concussion' && $rootScope.appData.curContext !== 'Eval') {
						$scope.$emit('drawer.disable.save.button')
					}
					$scope.logRecord.log_type = $rootScope.appData.curContext
					$scope.logRecord.log_date = $rootScope.appData.curDate
					$scope.logRecord.log_time = $rootScope.appData.curTime
					$scope.logRecord.users_dcid = $rootScope.appData.curUserDcid
					$scope.logRecord.injury_date = ['Concussion', 'Eval'].includes($scope.logRecord.log_type) ? $rootScope.appData.curDate : $scope.logRecord.injury_date
				} else {
					formatService.objIterator(data.data, formatKeys.dateKeys, 'formatDateFromApi')
					formatService.objIterator(data.data, formatKeys.timeKeys, 'convSecondsToTime12')
					$scope.logRecord = data.data
					const complaintValues = Object.values($rootScope.appData.complaintList)

					if (complaintValues.indexOf($scope.logRecord.complaint) === -1) {
						// The complaint value does not exist in the complaintList
						$scope.displayComplaintOther = true
						$scope.logRecord.complaint_other = $scope.logRecord.complaint
						$scope.logRecord.complaint = 'Other'
					}

					const destinationValues = Object.values($rootScope.appData.destinationList)

					if (destinationValues.indexOf($scope.logRecord.destination) === -1) {
						// The destination value does not exist in the destinationList
						$scope.displayDestinationOther = true
						$scope.logRecord.destination_other = $scope.logRecord.destination
						$scope.logRecord.destination = 'Other'
					}

					const conversationTypeValues = Object.values($rootScope.appData.conversationTypeList)

					if (conversationTypeValues.indexOf($scope.logRecord.conversation_type) === -1) {
						// The complaint value does not exist in the conversationType
						$scope.displayconversationTypeOther = true
						$scope.logRecord.conversation_type_other = $scope.logRecord.conversation_type
						$scope.logRecord.conversation_type = 'Other'
					}
				}
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

				$scope.logRecord = Object.assign($scope.logRecord, commonPayload)
				//add createFormatKeys to each object in submitPayload
				$scope.logRecord = Object.assign($scope.logRecord, formatKeys)
				//check for other values in dropdowns and takes the other value and puts it in the proper field in the logRecord also deletes the other field from the logRecord payload
				for (const key in $scope.logRecord) {
					if (key.endsWith('_other')) {
						const originalKey = key.replace('_other', '')
						if ($scope.logRecord[originalKey]) {
							$scope.logRecord[originalKey] = $scope.logRecord[key]
							delete $scope.logRecord[key]
						}
					}
				}

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
						enableSaveButton = $scope.logRecord.complaint && $scope.logRecord.treatment && $scope.logRecord.users_dcid
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
						enableSaveButton = $scope.logRecord.conversation_type && $scope.logRecord.contact && $scope.logRecord.users_dcid
						break
				}

				$scope.$emit(enableSaveButton ? 'drawer.enable.save.button' : 'drawer.disable.save.button')
			}
			//checks for other values in dropdowns and takes the other value and puts it in the proper field in the logRecord also deletes the other field from the logRecord payload
			$scope.handleFieldChange = function (fieldName) {
				delete $scope.logRecord[fieldName + '_other']
				$scope['display' + fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + 'Other'] = false
			}

			init()
		}
	])
})
