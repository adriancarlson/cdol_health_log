'use strict'
define(function (require) {
	var module = require('components/health_log/module')

	module.factory('jsonDataService', [
		'$http',
		'$q',
		function ($http, $q) {
			const dataUrls = {
				healthLogs: '/admin/students/health_log/data/healthLogData.json',
				staff: '/admin/students/health_log/data/staffData.json'
			}

			const normalizeRecords = data => {
				let records = typeof psUtils !== 'undefined' && psUtils.htmlEntitiesToCharCode
					? psUtils.htmlEntitiesToCharCode(data)
					: data

				if (typeof records === 'string') {
					records = JSON.parse(records)
				}

				if (!records) return []
				return Array.isArray(records) ? records : [records]
			}

			return {
				normalizeRecords: normalizeRecords,
				getData: (resource, params = {}) => {
					const dataUrl = dataUrls[resource]

					if (!dataUrl) {
						return $q.reject(new Error(`Unknown JSON data resource: ${resource}`))
					}

					return $http({
						url: dataUrl,
						method: 'GET',
						params: params
					}).then(res => {
						try {
							return normalizeRecords(res.data)
						} catch (error) {
							psAlert({ message: `There was an error parsing the data from ${dataUrl}`, title: 'Error Loading Data' })
							return $q.reject(error)
						}
					}, error => {
						psAlert({ message: `There was an error loading the data from ${dataUrl}`, title: 'Error Loading Data' })
						return $q.reject(error)
					})
				}
			}
		}
	])
})

