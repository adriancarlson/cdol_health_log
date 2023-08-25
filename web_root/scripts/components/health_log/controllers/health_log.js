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
				curStudentDCID: $attrs.ngCurStudentDcid,
				curStudentName: $attrs.ngCurStudentName,
				curUserDcid: $attrs.ngCurUserDcid,
				curDate: $attrs.ngCurDate,
				curTime: $attrs.ngCurTime,
				curContext: $attrs.ngCurContext,
				complaintList: {
					B: 'Bloody Nose',
					CS: 'Cold Symptoms',
					C: 'Cramps',
					D: 'Dizziness',
					H: 'Headache',
					I: 'Injury ',
					N: 'Nausea',
					T: 'Sore Throat',
					S: 'Stomachache',
					V: 'Vomiting',
					O: 'Other'
				},
				treatmentList: {
					B: 'Controlled Bleeding',
					I: 'Ice Applied',
					M: 'Med Administration',
					W: 'Water/Snack',
					O: 'Other'
				},
				destinationList: {
					B: 'Back to Class',
					C: 'Counselor',
					H: 'Home',
					F: 'Office',
					O: 'Other'
				}
			}
			$scope.setfullContext = () => {
				const contextMap = {
					Daily: 'Daily Health Log',
					Athletic: 'Athletic Injury',
					Concussion: 'Concussion Evaluation',
					Eval: 'Injury Evaluation'
				}
				document.title = $rootScope.appData.fullContext = contextMap[$rootScope.appData.curContext] || 'Log'
				document.title = `${document.title} - ${$rootScope.appData.curStudentName}`
			}

			$rootScope.loadLogData = async logData => {
				loadingDialog()
				const pqData = { curSchoolID: $rootScope.appData.curSchoolId, yearID: $rootScope.appData.curYearId, curStudentDCID: $rootScope.appData.curStudentDCID, logType: logData }
				$scope.healthLogList = await pqService.getPQResults('net.cdolinc.health.healthLog.logs', pqData)
				$rootScope.appData.staffList = await pqService.getPQResults('net.cdolinc.health.healthLog.staff', { curSchoolID: $rootScope.appData.curSchoolId })
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
	module.filter('convSecondsToTime12', function () {
		return function (psec) {
			if (psec === null || isNaN(psec)) {
				return '' // Return empty string for null or NaN inputs
			}
			let hours = Math.floor(psec / 3600)
			let minutes = Math.floor((psec - hours * 3600) / 60)
			let meridiem = 'AM'
			if (hours * 60 * 60 >= 43200) {
				meridiem = 'PM'
				if (hours !== 12) {
					hours -= 12
				}
			}
			hours = hours < 10 ? '0' + hours : hours
			minutes = minutes < 10 ? '0' + minutes : minutes
			let strTime = hours + ':' + minutes + ' ' + meridiem
			return strTime
		}
	})
})
