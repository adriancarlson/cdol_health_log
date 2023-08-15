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
					$scope.logRecord.injury_date = ['Concussion', 'Eval'].includes($scope.logRecord.log_type) ? $rootScope.appData.curDate : $scope.logRecord.injury_date
				} else {
					formatService.objIterator(data.data, formatKeys.dateKeys, 'formatDateFromApi')
					formatService.objIterator(data.data, formatKeys.timeKeys, 'convSecondsToTime12')
					$scope.logRecord = data.data
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

			init()

			$scope.updateScopeFromDropdown = resource => {
				//if dropdown source is user data
				if (resource === 'usersData') {
					$scope.logRecord.users_dcid
				}
			}
		}
	])
})
