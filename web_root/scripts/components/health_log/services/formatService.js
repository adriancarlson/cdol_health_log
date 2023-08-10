'use strict'
define(function (require) {
	var module = require('components/health_log/module')
	module.factory('formatService', [
		function () {
			//dateformats
			let dateSvc = this
			dateSvc.dateFormat = 'mm/dd/yyyy'
			dateSvc.monthIndex = 0
			dateSvc.dayIndex = 1
			dateSvc.yearIndex = 2
			dateSvc.delimiter = '/'
			return {
				setDateFormat: dateString => {
					dateString = dateString.toLowerCase()
					let dateParts = dateString.split(/[.,\/ -]/)
					if (dateParts.length != 3) return
					if (!dateParts.includes('mm') || !dateParts.includes('dd') || !dateParts.includes('yyyy')) return
					dateSvc.dateFormat = dateString
					dateSvc.monthIndex = dateParts.indexOf('mm')
					dateSvc.dayIndex = dateParts.indexOf('dd')
					dateSvc.yearIndex = dateParts.indexOf('yyyy')
					if (dateString.indexOf('/') > 0) dateSvc.delimiter = '/'
					else if (dateString.indexOf(',') > 0) dateSvc.delimiter = ','
					else if (dateString.indexOf('.') > 0) dateSvc.delimiter = '.'
					else if (dateString.indexOf('-') > 0) dateSvc.delimiter = '-'
				},

				//dt - date string (PS date format ~[dateformat])
				//return date string (yyyy-mm-dd)
				formatDateForApi: dt => {
					if (!dt) return ''
					let dateParts = dt.split(dateSvc.delimiter)
					if (dateParts.length != 3) return ''
					let m = dateParts[dateSvc.monthIndex]
					let d = dateParts[dateSvc.dayIndex]
					let y = dateParts[dateSvc.yearIndex]
					return y + '-' + m + '-' + d
				},

				//dt - date string (yyyy-dd-mm)
				//return date string (PS date format ~[dateformat])
				formatDateFromApi: dt => {
					if (!dt) return ''
					let dateParts = dt.split('-')
					if (dateParts.length != 3) return ''
					let y = dateParts[0]
					let m = dateParts[1]
					let d = dateParts[2]
					return dateSvc.getPsDateString(m, d, y)
				},

				//dt - javascript date object
				//return date string format PS date format ~[dateformat]
				dateToString: dt => {
					let d = dt.getDate()
					let m = dt.getMonth() + 1 //January is 0!
					let y = dt.getFullYear()
					if (d < 10) d = '0' + d
					if (m < 10) m = '0' + m
					if (isNaN(m)) return ''
					return dateSvc.getPsDateString(m, d, y)
				},

				getPsDateString: (m, d, y) => {
					returnVal = ''
					for (let i = 0; i < 3; i++) {
						if (dateSvc.monthIndex == i) returnVal += m
						else if (dateSvc.dayIndex == i) returnVal += d
						else returnVal += y
						if (i < 2) returnVal += dateSvc.delimiter
					}
					return returnVal
				},

				//accept a string date (PS date format ~[dateformat])
				//return string representation of date plus increment days
				addDays: (dateString, increment) => {
					let dateParts = dateString.split(dateSvc.delimiter)
					let m = dateParts[dateSvc.monthIndex]
					let d = dateParts[dateSvc.dayIndex]
					let y = dateParts[dateSvc.yearIndex]
					let dateVal = new Date()
					dateVal.setMonth(0)
					dateVal.setDate(d)
					dateVal.setYear(y)
					dateVal.setMonth(m - 1)
					dateVal.setDate(dateVal.getDate() + increment)
					return this.dateToString(dateVal)
				},
				//case formats
				camelize: str => {
					return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
						if (+match === 0) return ''
						return index === 0 ? match.toLowerCase() : match.toUpperCase()
					})
				},

				decamelize: str => {
					return str
						.replace(/([A-Z])/g, ' $1')
						.trim()
						.replace(/^./, function (str) {
							return str.toUpperCase()
						})
				},

				sentenceCase: str => {
					let n = str.split('.')
					let vfinal = ''
					for (i = 0; i < n.length; i++) {
						var spaceput = ''
						var spaceCount = n[i].replace(/^(\s*).*$/, '$1').length
						n[i] = n[i].replace(/^\s+/, '')
						var newstring = n[i].charAt(n[i]).toUpperCase() + n[i].slice(1)
						for (j = 0; j < spaceCount; j++) spaceput = spaceput + ' '
						vfinal = vfinal + spaceput + newstring + '.'
					}
					vfinal = vfinal.substring(0, vfinal.length - 1)
					return vfinal
				},

				titleCase: str => {
					const buildString = str || ''
					return buildString
						.toLowerCase()
						.split(' ')
						.map(word => {
							return word.charAt(0).toUpperCase() + word.slice(1)
						})
						.join(' ')
						.trim()
				},
				//checkmark formats
				formatChecksForApi: val => {
					val = val.toString()
					return val
				},

				formatChecksFromApi: val => {
					if (val == 'true') {
						val = true
					} else {
						val = false
					}
					return val
				},
				// object iterator
				objIterator: (obj, iterKeys, iterType) => {
					const objKeys = Object.keys(obj)
					objKeys.forEach(keyName => {
						// looping through first object
						iterKeys.forEach(iterKey => {
							// using index of to check if the object key name have a matched string if so deleting it from the payload
							if (keyName.indexOf(iterKey) !== -1) {
								// if iterType contains delete than delete the key
								if (iterType.includes('delete')) {
									delete obj[keyName]
									// else perfore an iterType function on the key
								} else {
									obj[keyName] = this[iterType](obj[keyName])
								}
							}
						})
					})
					return obj
				}
			}
		}
	])
})
