'use strict'
define(function (require) {
	let module = require('components/health_log/module')

	module.controller('healthLogEditCtrl', [
		'$scope',
		'$rootScope',
		'psApiService',
		function ($scope, $rootScope, psApiService) {
			$scope.logRecord = {}
			const commonPayload = {
				schoolid: $rootScope.appData.curSchoolId,
				yearid: $rootScope.appData.curYearId,
				studentsdcid: $rootScope.appData.curStudentID
			}
			const formatKeys = {
				dateKeys: ['_date'],
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
				} else {
					$scope.logRecord = data.data
					// formatService.objIterator(resData, apiPayload.dateKeys, 'formatDateFromApi')
					console.log('Edit Item button Clicked')
					console.log(data)
				}
				openCallBack()
			}

			let cancelDrawer = closeDrawer => {
				$scope.logRecord = {}
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
				$rootScope.reloadData()
				closeLoading()
				closeDrawer(true)
			}

			init()
		}
	])
})
