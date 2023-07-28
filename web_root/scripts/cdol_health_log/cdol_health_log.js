define(['angular', 'components/shared/index', '/scripts/cdol/services/pqService.js'], function (angular) {
	var cdolHealthLogApp = angular.module('cdolHealthLogMod', ['powerSchoolModule', 'pqModule'])

	cdolHealthLogApp.controller('cdolHealthLogCtrl', function ($scope, $attrs, pqService) {
		$scope.staffChangeCounts = []
		$scope.healthLogList = {}
		$scope.curSchoolId = $attrs.ngCurSchoolId
		$scope.curYearId = $attrs.ngCurYearId
		$scope.curStudentID = $attrs.ngCurStudentId
		$scope.curDate = $attrs.ngCurDate
		$scope.curTime = $attrs.ngCurTime
		$scope.curContext = $attrs.ngCurContext

		$scope.loadData = async logData => {
			loadingDialog()
			//only make API call to get the data if
			// 			if (!$scope.healthLogList) {
			//setting up arguments for PQ call
			const pqData = { curSchoolID: $scope.curSchoolId, yearID: $scope.curYearId, curStudentID: $scope.curStudentID, logType: logData }

			// // getting staff counts
			// const countRes = await pqService.getPQResults('net.cdolinc.health.healthLog.counts', pqData)
			// $scope.healthLogCounts = countRes[0]

			// adding new new change type key/value pair for PQ call to staff list
			// pqData.logData = logData

			//setting up function to add key and value staff list to staffList object
			// const updateHealthLogList = (key, value) => ($scope.healthLogList[key] = value)

			// getting staff List for current change type
			const res = await pqService.getPQResults('net.cdolinc.health.healthLog.logs', pqData)

			$scope.healthLogList = res
			//updating staffList obj
			// updateHealthLogList(logData, res)

			$scope.$digest()
			// 			}
			closeLoading()
			console.log($scope.healthLogList)
		}

		// fire the function to load the data
		$scope.loadData($scope.curContext)

		// grab selected tab reload data and have the selected tab display data
		$scope.reloadData = () => {
			$scope.healthLogCounts = []
			$scope.healthLogList = {}
			$scope.loadData($scope.curContext)
		}
	})
	cdolHealthLogApp.directive('logList', () => ({ templateUrl: '/admin/students/health_log/directives/log_list.html' }))
})
