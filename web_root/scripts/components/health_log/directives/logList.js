'use strict'
define(function (require) {
	var module = require('components/health_log/module')

	module.directive('logList', [
		function () {
			return {
				restrict: 'E',
				templateUrl: '/admin/students/health_log/views/log_list.html'
			}
		}
	])
})
