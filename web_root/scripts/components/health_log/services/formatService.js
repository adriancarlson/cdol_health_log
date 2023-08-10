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
				setDateFormat: function (dateString) {
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
				formatDateForApi: function (dt) {
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
				formatDateFromApi: function (dt) {
					if (!dt) return ''
					let dateParts = dt.split('-')
					if (dateParts.length != 3) return ''
					let y = dateParts[0]
					let m = dateParts[1]
					let d = dateParts[2]
					return this.getPsDateString(m, d, y)
				},

				//dt - javascript date object
				//return date string format PS date format ~[dateformat]
				dateToString: function (dt) {
					let d = dt.getDate()
					let m = dt.getMonth() + 1 //January is 0!
					let y = dt.getFullYear()
					if (d < 10) d = '0' + d
					if (m < 10) m = '0' + m
					if (isNaN(m)) return ''
					return this.getPsDateString(m, d, y)
				},

				getPsDateString: function (m, d, y) {
					let returnVal = ''
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
				addDays: function (dateString, increment) {
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
				// Convert Seconds (integer) to Time (12 hr AM/PM) -- no seconds
				//Time formats Adapted from Peter Nethercott's Log Entry Management Plugin
				convSecondsToTime12: function (psec) {
					let hours = Math.floor(psec / 3600)
					let minutes = Math.floor((psec - hours * 3600) / 60)
					let meridiem = 'AM'
					if (hours * 60 * 60 >= 43200) {
						meridiem = 'PM'
						if (hours != '12') hours -= 12
					}
					hours = hours < 10 ? '0' + hours : hours
					minutes = minutes < 10 ? '0' + minutes : minutes
					let strTime = hours + ':' + minutes + ' ' + meridiem
					//have to convert to string for API call
					return strTime.toString()
				},

				// Convert Time (12 hr AM/PM) to Seconds (integer)
				// Adapted from Peter Nethercott's Log Entry Management Plugin
				convTime12ToSeconds: function (ptime) {
					let hrs = ptime.substr(0, 2)
					let min = ptime.substr(3, 2)
					let intSecs = hrs * 3600 + min * 60 + (ptime.substr(6, 2) === 'PM' && hrs != '12' ? 43200 : 0)
					return intSecs
				},

				//case formats
				camelize: function (str) {
					return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
						if (+match === 0) return ''
						return index === 0 ? match.toLowerCase() : match.toUpperCase()
					})
				},

				decamelize: function (str) {
					return str
						.replace(/([A-Z])/g, ' $1')
						.trim()
						.replace(/^./, function (str) {
							return str.toUpperCase()
						})
				},

				sentenceCase: function (str) {
					let n = str.split('.')
					let vfinal = ''
					for (i = 0; i < n.length; i++) {
						let spaceput = ''
						let spaceCount = n[i].replace(/^(\s*).*$/, '$1').length
						n[i] = n[i].replace(/^\s+/, '')
						let newstring = n[i].charAt(n[i]).toUpperCase() + n[i].slice(1)
						for (j = 0; j < spaceCount; j++) spaceput = spaceput + ' '
						vfinal = vfinal + spaceput + newstring + '.'
					}
					vfinal = vfinal.substring(0, vfinal.length - 1)
					return vfinal
				},

				titleCase: function (str) {
					const buildString = str || ''
					return buildString
						.toLowerCase()
						.split(' ')
						.map(function (word) {
							return word.charAt(0).toUpperCase() + word.slice(1)
						})
						.join(' ')
						.trim()
				},
				//checkmark formats
				formatChecksForApi: function (val) {
					val = val.toString()
					return val
				},

				formatChecksFromApi: function (val) {
					if (val == 'true') {
						val = true
					} else {
						val = false
					}
					return val
				},
				// object iterator
				objIterator: function (obj, iterKeys, iterType) {
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
