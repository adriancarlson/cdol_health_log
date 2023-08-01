define(['angular', 'components/shared/index', '/scripts/cdol/services/pqService.js', '/scripts/cdol/services/formatService.js', '/scripts/cdol/services/psApiService.js'], function (angular) {
	var cdolHealthLogApp = angular.module('cdolHealthLogMod', ['powerSchoolModule', 'pqModule', 'formatService', 'psApiModule'])

	cdolHealthLogApp.controller('cdolHealthLogCtrl', function ($scope, $attrs, pqService, formatService, psApiService) {
		$scope.staffChangeCounts = []
		$scope.healthLogList = {}
		$scope.curSchoolId = $attrs.ngCurSchoolId
		$scope.curYearId = $attrs.ngCurYearId
		$scope.curStudentID = $attrs.ngCurStudentId
		$scope.curDate = $attrs.ngCurDate
		$scope.curTime = $attrs.ngCurTime
		$scope.curContext = $attrs.ngCurContext

		$scope.setfullContext = () => {
			$scope.fullContext = ''
			switch ($scope.curContext) {
				case 'Daily':
					$scope.fullContext = 'Daily Health Log'
					break
				case 'Athletic':
					$scope.fullContext = 'Athletic Injury'
					break
				case 'Concussion':
					$scope.fullContext = 'Concussion Eval'
					break
				case 'Eval':
					$scope.fullContext = 'Injury Eval'
					break
				default:
					$scope.fullContext = 'Log'
			}
		}

		$scope.loadData = async logData => {
			loadingDialog()
			const pqData = { curSchoolID: $scope.curSchoolId, yearID: $scope.curYearId, curStudentID: $scope.curStudentID, logType: logData }
			const res = await pqService.getPQResults('net.cdolinc.health.healthLog.logs', pqData)
			$scope.healthLogList = res
			$scope.setfullContext()
			$scope.$digest()
			closeLoading()
			console.log($scope.healthLogList)
		}

		// fire the function to load the data
		// 		$scope.loadData($scope.curContext)

		// grab selected tab reload data and have the selected tab display data
		$scope.reloadData = () => {
			$scope.healthLogCounts = []
			$scope.healthLogList = {}
			$scope.loadData($scope.curContext)
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

		var init = function () {
			$scope.$emit('open.drawer.event', function (callback, data) {
				console.log('open event received', data)
				callback()
			})
			$scope.$emit('cancel.drawer.event', function (callback, data) {
				console.log('cancel event received')
				callback()
			})
			$scope.$emit('save.drawer.event', function (callback, data) {
				console.log('save event received')
				callback()
			})
			$scope.$emit('this.is.my.new.event', function (callback, data) {
				console.log('this.is.my.new.event received')
			})
			$scope.$emit('this.is.my.new.event2', function (callback, data) {
				console.log('this.is.my.new.event2 received')
				callback()
			})
			$scope.$emit('this.is.my.new.event4', function (callback, data) {
				console.log('this.is.my.new.event4 received')
				callback()
			})
		}

		init()
	})
	cdolHealthLogApp.directive('logList', () => ({ templateUrl: '/admin/students/health_log/directives/log_list.html' }))
})
