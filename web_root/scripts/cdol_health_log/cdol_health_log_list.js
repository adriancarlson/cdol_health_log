define(['angular', 'components/shared/index', '/scripts/cdol/services/pqService.js'], function (angular) {
	var cdolHealthLogListApp = angular.module('cdolHealthLogListMod', ['powerSchoolModule', 'pqModule'])

	cdolHealthLogListApp.controller('cdolHealthLogListCtrl', function ($scope, $attrs, pqService) {
		$scope.staffChangeCounts = []
		$scope.healthLogList = {}
		$scope.curSchoolId = $attrs.ngCurSchoolId
		$scope.curYearId = $attrs.ngCurYearId
		$scope.curStudentDCID = $attrs.ngCurStudentDCID
		$scope.curDate = $attrs.ngCurDate
		$scope.calendarYear = new Date().getFullYear()
		$scope.selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context')

		$scope.loadData = async logType => {
			loadingDialog()
			//only make API call to get the data if
			if (!$scope.healthLogList.hasOwnProperty(logType)) {
				//setting up arguments for PQ call
				const pqData = { curSchoolID: $scope.curSchoolId, calendarYear: $scope.calendarYear, curStudentDCID: $scope.curStudentDCID }

				// getting staff counts
				const countRes = await pqService.getPQResults('net.cdolinc.health.healthLog.counts', pqData)
				$scope.healthLogCounts = countRes[0]

				// adding new new change type key/value pair for PQ call to staff list
				pqData.logType = logType

				//setting up function to add key and value staff list to staffList object
				const updateHealthLogList = (key, value) => ($scope.healthLogList[key] = value)

				// getting staff List for current change type
				const res = await pqService.getPQResults('net.cdolinc.health.healthLog.logs', pqData)

				//updating staffList obj
				updateHealthLogList(logType, res)

				$scope.$digest()
			}
			closeLoading()
		}

		// fire the function to load the data
		$scope.loadData($scope.selectedTab)

		// grab selected tab reload data and have the selected tab display data
		$scope.reloadData = () => {
			$scope.healthLogCounts = []
			$scope.healthLogList = {}
			$scope.loadData($scope.selectedTab)
		}
	})
	cdolStaffListApp.directive('dailyList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/daily_list.html' }))
	cdolStaffListApp.directive('athleticList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/athletic_list.html' }))
	cdolStaffListApp.directive('concussionList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/concussion_list.html' }))
	cdolStaffListApp.directive('injuryList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/evaluation_list.html' }))
})
