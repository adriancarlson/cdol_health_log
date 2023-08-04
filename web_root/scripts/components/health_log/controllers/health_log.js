'use strict'
define(function (require) {
	var module = require('components/health_log/module')

	module.controller('healthLogCtrl', [
		'$http',
		'$scope',
		'$rootScope',
		function ($http, $scope, $rootScope) {
			$scope.listData = []
			$rootScope.appData = {
				institutions: [],
				requestStatus: {
					N: 'New',
					U: 'Under Development',
					C: 'Complete (Not Submitted)',
					S: 'Submitted'
				},
				outcomes: {
					C: 'Considering',
					W: 'Waitlist',
					A: 'Accepted',
					D: 'Denied',
					O: 'Other'
				}
			}
			var init = function () {
				// loadData will be called by the view to leverage PSHTML
				$scope.loadInstitutions()
			}

			$scope.loadData = function (studentFrn) {
				loadingDialog()
				console.log('running Load Data')
				closeLoading()
			}

			$scope.loadInstitutions = function () {
				console.log('running Load Institutions')
			}

			init()
		}
	])
})
