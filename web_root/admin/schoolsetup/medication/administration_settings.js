define([
	'angular',
	'components/shared/powerschoolModule',
	'components/health_log/module',
	'components/health_log/services/formatService',
	'components/health_log/services/psApiService'
], angular => {
	'use strict'
	const module = angular.module('medicationSettingsModule', ['powerSchoolModule', 'healthLogMod'])

	const normalizeTime = value => {
		const match = String(value || '').trim().toUpperCase().match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/)
		if (!match) return ''
		return `${match[1].padStart(2, '0')}:${match[2]} ${match[3]}`
	}
	const timeToSeconds = value => {
		const normalized = normalizeTime(value)
		if (!normalized) return null
		const hours = Number(normalized.slice(0, 2)) % 12 + (normalized.endsWith('PM') ? 12 : 0)
		return hours * 3600 + Number(normalized.slice(3, 5)) * 60
	}
	const secondsToTime = value => {
		const totalSeconds = Number(value)
		if (!Number.isFinite(totalSeconds) || totalSeconds < 0 || totalSeconds >= 86400) return ''
		const hours24 = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const hours12 = hours24 % 12 || 12
		return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${hours24 >= 12 ? 'PM' : 'AM'}`
	}

	module.controller('medicationSettingsController', function ($attrs, psApiService) {
		const vm = this
		vm.schoolId = Number($attrs.ngCurSchoolId)
		vm.isDistrictOffice = !Number.isFinite(vm.schoolId) || vm.schoolId === 0
		vm.settingId = null
		vm.cutoffTime = ''
		vm.isValid = false
		vm.saving = false
		vm.feedbackMessage = ''

		vm.validate = () => {
			vm.cutoffTime = String(vm.cutoffTime || '')
			vm.isValid = !vm.isDistrictOffice && timeToSeconds(vm.cutoffTime) !== null && !vm.saving
		}

		const load = () => {
			if (vm.isDistrictOffice) return
			loadingDialog()
			psApiService.psApiCall('u_cdol_med_admin_setting', 'GET', {})
				.then(records => {
					const settings = (Array.isArray(records) ? records : [records])
						.filter(record => record && Number(record.schoolid) === vm.schoolId)
						.sort((left, right) => Number(right.id) - Number(left.id))
					const setting = settings[0]
					if (setting) {
						vm.settingId = Number(setting.id)
						vm.cutoffTime = secondsToTime(setting.daily_cutoff_time)
					}
					vm.validate()
				})
				.finally(() => closeLoading())
		}

		vm.save = () => {
			vm.validate()
			if (!vm.isValid) {
				psAlert({
					title: 'Invalid Cutoff Time',
					message: 'Enter a valid time such as 03:00 PM.'
				})
				return
			}

			vm.saving = true
			vm.feedbackMessage = ''
			vm.validate()
			loadingDialog()
			const payload = {
				schoolid: vm.schoolId,
				daily_cutoff_time: timeToSeconds(vm.cutoffTime)
			}
			const method = vm.settingId ? 'PUT' : 'POST'
			psApiService.psApiCall('u_cdol_med_admin_setting', method, payload, vm.settingId)
				.then(result => {
					if (!vm.settingId) {
						const savedRecords = Array.isArray(result) ? result : [result]
						const savedRecord = savedRecords.find(record => record && record.id)
						if (savedRecord) vm.settingId = Number(savedRecord.id)
					}
					vm.cutoffTime = normalizeTime(vm.cutoffTime)
					vm.feedbackMessage = `Daily medication cutoff saved as ${vm.cutoffTime}.`
				})
				.finally(() => {
					vm.saving = false
					vm.validate()
					closeLoading()
				})
		}

		load()
	})
})
