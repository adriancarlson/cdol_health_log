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
				schoolid: $scope.appData.curSchoolId,
				yearid: $scope.appData.curYearId,
				studentsdcid: data.studentsdcid
			}
			const formatKeys = {
				dateKeys: ['_date']
			}

			let init = function () {
				// $scope.currentContext = context
				$scope.$emit('open.drawer.event', openDrawer)
				$scope.$emit('cancel.drawer.event', cancelDrawer)
				$scope.$emit('save.drawer.event', saveDrawer)
			}

			let openDrawer = function (openCallBack, data) {
				if (data.data.id == null) {
					console.log('curContext', $rootScope.appData.curContext)
					$scope.logRecord.log_type = $rootScope.appData.curContext
					console.log(data)
					// clearModel(data)
				} else {
					$scope.logRecord = data.data
					// loadModel(data)
					console.log('Edit Item button Clicked')
					console.log(data)
				}
				openCallBack()
			}

			// let clearModel = function (data) {
			// 	Object.keys(context).forEach(function (key) {
			// 		// preserve studentsdcid for new record
			// 		if (key == 'studentsdcid') {
			// 			context[key] = data.data[key]
			// 			// clear all other keys
			// 		} else {
			// 			context[key] = null
			// 		}
			// 	})
			// }

			// let loadModel = function (data) {
			// 	Object.keys(context).forEach(function (key) {
			// 		context[key] = data.data[key]
			// 	})
			// }

			let cancelDrawer = function (closeDrawer) {
				$scope.logRecord = {}
				closeDrawer()
			}

			let saveDrawer = async function (closeDrawer, data) {
				loadingDialog()
				$scope.logRecord = Object.assign(logRecord, commonPayload)
				//add createFormatKeys to each object in submitPayload
				$scope.logRecord = Object.assign(logRecord, formatKeys)

				//submitting staff changes through api
				await psApiService.psApiCall('u_cdol_health_log', 'POST', $scope.logRecord)
				console.log(res)
				if (returned.status == 200 || returned.status == 201) {
					closeLoading()
					data.data = $scope.logRecord
					$scope.$emit('saved.item.row', data.data)
					closeDrawer(true)
				} else {
					//FAIL
					closeDrawer(false)
				}

				// saveData(RESOURCE_URL, buildPayload()).then(
				// 	function (returned) {
				// 		closeLoading()
				// 		if (returned.status == 200 || returned.status == 201) {
				// 			data.data = context
				// 			$scope.$emit('saved.item.row', data.data)
				// 			closeDrawer(true)
				// 		} else {
				// 			//FAIL
				// 			closeDrawer(false)
				// 		}
				// 	},
				// 	function (error) {
				// 		closeLoading()
				// 		if (error.status === 409 && error.data && psUtils.hasValue(error.data.message)) {
				// 			warningMessages = [error.data.message]
				// 		} else if (error.status === 403) {
				// 			errorMessages = ['You do not have permission']
				// 		} else {
				// 			errorMessages = ['An error occurred contact your system administrator']
				// 		}
				// 		closeDrawer(false)
				// }
				// )
			}

			let saveData = function (resourceURL, payload) {
				let URL
				if (payload.id > 0) {
					URL = resourceURL + '/' + payload.id
					return $http.put(URL, payload, JSON_HEADER)
				} else {
					URL = resourceURL
					return $http.post(URL, payload, JSON_HEADER)
				}
			}

			let buildPayload = function () {
				// fix null values - change to empty string
				Object.keys(context).forEach(function (key) {
					if (context[key] == null) context[key] = ''
				})

				// base payload common for both add and update
				let payload = {
					tables: {
						[RESOURCE_TABLE]: {
							institutionid: context.institutionid,
							request_date: parseDateString(context.request_date),
							request_status: context.request_status,
							scholarship: context.scholarship,
							scholarship_amount: context.scholarship_amount,
							completion_date: parseDateString(context.completion_date),
							outcome: context.outcome,
							notes: context.notes
						}
					}
				}
				if (context.id > 0) {
					// existing record - add necessary payload data
					payload.id = context.id
					payload.name = RESOURCE_TABLE
				} else {
					// new record needs studentsdcid for foreign key 1-many requirement
					payload.tables[RESOURCE_TABLE].studentsdcid = context.studentsdcid
				}
				return payload
			}

			init()
		}
	])
})
