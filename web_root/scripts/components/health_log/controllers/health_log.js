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
				curStudentName: $attrs.ngCurStudentName,
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
				document.title = `${document.title} - ${$rootScope.appData.curStudentName}`
			}

			$rootScope.loadLogData = async logData => {
				loadingDialog()
				const pqData = { curSchoolID: $scope.curSchoolId, yearID: $scope.curYearId, curStudentID: $scope.curStudentID, logType: logData }
				const res = await pqService.getPQResults('net.cdolinc.health.healthLog.logs', pqData)
				$scope.healthLogList = res
				$scope.setfullContext()
				$scope.$digest()
				closeLoading()
			}

			$rootScope.reloadData = () => {
				$scope.healthLogCounts = []
				$scope.healthLogList = []
				$rootScope.loadLogData($scope.appData.curContext)
				$scope.$digest()
			}

			$scope.delConfirm = logId => {
				psConfirm({
					title: `Delete ${$rootScope.appData.fullContext}`,
					message: `    Are you sure you want to delete this ${$rootScope.appData.fullContext}?    `,
					oktext: 'Delete',
					canceltext: 'Cancel',
					ok: async () => {
						await psApiService.psApiCall('u_cdol_health_log', 'DELETE', {}, logId)
						await $rootScope.reloadData()
					}
				})
			}
		}
	])
})
