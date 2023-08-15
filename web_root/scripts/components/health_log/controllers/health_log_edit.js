'use strict'
define(function (require) {
	let module = require('components/health_log/module')

	module.controller('healthLogEditCtrl', [
		'$scope',
		'$rootScope',
		'psApiService',
		'formatService',
		function ($scope, $rootScope, psApiService, formatService) {
			$scope.logRecord = {}
			const commonPayload = {
				schoolid: $rootScope.appData.curSchoolId,
				yearid: $rootScope.appData.curYearId,
				studentsdcid: $rootScope.appData.curStudentID
			}
			const formatKeys = {
				dateKeys: ['_date'],
				timeKeys: ['_time'],
				deleteKeys: ['_title', '_name']
			}

			let init = () => {
				// $scope.currentContext = context
				$scope.$emit('open.drawer.event', openDrawer)
				$scope.$emit('cancel.drawer.event', cancelDrawer)
				$scope.$emit('save.drawer.event', saveDrawer)
			}

			let openDrawer = (openCallBack, data) => {
				if (data.data.id == null) {
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
					} else {
						// The complaint value exists in the complaintList
						console.log('Complaint value exists:', $scope.logRecord.complaint)
					}

					const destinationValues = Object.values($rootScope.appData.destinationList)

					if (destinationValues.indexOf($scope.logRecord.destination) === -1) {
						// The destination value does not exist in the destinationList
						$scope.displayDestinationOther = true
						$scope.logRecord.destination_other = $scope.logRecord.destination
						$scope.logRecord.destination = 'Other'
					} else {
						// The destination value exists in the destinationList
						console.log('destination value exists:', $scope.logRecord.destination)
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

				if ($scope.logRecord.complaint_other) {
					$scope.logRecord.complaint = $scope.logRecord.complaint_other
					delete $scope.logRecord['complaint_other']
				}

				if ($scope.logRecord.destination_other) {
					$scope.logRecord.destination = $scope.logRecord.destination_other
					delete $scope.logRecord['destination_other']
				}

				//submitting staff changes through api
				if ($scope.logRecord.id) {
					let recordId = $scope.logRecord.id
					delete $scope.logRecord['id']
					delete $scope.logRecord['studentsdcid']
					await psApiService.psApiCall('u_cdol_health_log', 'PUT', $scope.logRecord, recordId)
				} else {
					await psApiService.psApiCall('u_cdol_health_log', 'POST', $scope.logRecord)
				}
				$scope.logRecord = {}
				$rootScope.reloadData()
				closeLoading()
				closeDrawer(true)
			}

			// Inside your controller
			$scope.handleComplaintChange = function () {
				delete $scope.logRecord['complaint_other']
				$scope.displayComplaintOther = false
			}
			$scope.handleDestinationChange = function () {
				delete $scope.logRecord['destination_other']
				$scope.displayDestinationOther = false
			}

			init()
		}
	])
})
