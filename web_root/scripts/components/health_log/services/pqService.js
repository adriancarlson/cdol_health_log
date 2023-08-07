'use strict'
define(function (require) {
	var module = require('components/health_log/module')
	module.factory('pqService', [
		'$http',
		'$q',
		function ($http, $q) {
			return {
				getPQResults: (query, data) => {
					let deferredResponse = $q.defer()
					$http({
						url: '/ws/schema/query/' + query,
						method: 'POST',
						data: data || {},
						params: { pagesize: 0 },
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json'
						}
					}).then(
						res => {
							deferredResponse.resolve(res.data.record || [])
						},
						res => {
							psAlert({ message: `There was an error loading the data from ${query}`, title: 'Error Loading Data' })
						}
					)
					return deferredResponse.promise
				}
			}
		}
	])
})
