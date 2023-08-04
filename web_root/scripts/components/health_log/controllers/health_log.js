'use strict'
define(function (require) {
	var module = require('components/health_log/module')

	module.controller('healthLogCtrl', [
		'$scope',
		'$rootScope',
		'$attrs',
		function ($scope, $rootScope, $attrs) {
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

			$scope.loadLogData = studentFrn => {
				loadingDialog()
				console.log('studentfrn:', studentFrn)
				$scope.setfullContext()
				closeLoading()
			}
		}
	])
})
