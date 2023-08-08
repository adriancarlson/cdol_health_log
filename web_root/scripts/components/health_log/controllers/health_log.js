'use strict'
define(function (require) {
	var module = require('components/health_log/module')

	module.controller('healthLogCtrl', [
		'$scope',
		'$rootScope',
		'$attrs',
		'pqService',
		'psApiService',
		function ($scope, $rootScope, $attrs, pqService, psApiService) {
			$scope.healthLogCounts = []
			$scope.healthLogList = []
			$rootScope.appData = {
				curSchoolId: $attrs.ngCurSchoolId,
				curYearId: $attrs.ngCurYearId,
				curStudentID: $attrs.ngCurStudentId,
				curDate: $attrs.ngCurDate,
				curTime: $attrs.ngCurTime,
				curContext: $attrs.ngCurContext
			}
			$scope.setfullContext = () => {
				const contextMap = {
					Daily: 'Daily Health Log',
					Athletic: 'Athletic Injury',
					Concussion: 'Concussion Eval',
					Eval: 'Injury Eval'
				}
				document.title = $rootScope.appData.fullContext = contextMap[$rootScope.appData.curContext] || 'Log'
			}

			$scope.loadLogData = async logData => {
				loadingDialog()
				const pqData = { curSchoolID: $scope.curSchoolId, yearID: $scope.curYearId, curStudentID: $scope.curStudentID, logType: logData }
				const res = await pqService.getPQResults('net.cdolinc.health.healthLog.logs', pqData)
				$scope.healthLogList = res
				$scope.setfullContext()
				$scope.$digest()
				closeLoading()
				console.log($scope.healthLogList)
			}

			$scope.reloadData = () => {
				$scope.healthLogCounts = []
				$scope.healthLogList = []
				$scope.loadData($scope.appData.curContext)
			}

			$scope.delConfirm = logId => {
				psConfirm({
					title: `Delete ${$scope.fullContext}`,
					message: `Are you sure you want to delete this ${$scope.fullContext}?`,
					oktext: 'Delete',
					canceltext: 'Cancel',
					ok: async () => {
						console.log(logId)
						await psApiService.psApiCall('u_cdol_health_log', 'DELETE', {}, logId)
						await $scope.reloadData()
					}
				})
			}
		}
	])
})
