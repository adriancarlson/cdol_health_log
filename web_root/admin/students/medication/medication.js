define(['angular', 'components/shared/powerschoolModule', 'components/health_log/module', 'components/health_log/services/formatService', 'components/health_log/services/jsonDataService', 'components/health_log/services/psApiService'], angular => {
	'use strict'
	const medicationModule = angular.module('medicationModule', ['powerSchoolModule', 'healthLogMod'])
	const LOW_INVENTORY_PERCENTAGE = 20
	const CRITICAL_INVENTORY_PERCENTAGE = 10
	const normalizeMedicationNameSpacing = value => {
		const normalizedName = String(value === undefined || value === null ? '' : value)
			.trim()
			.replace(/\s+/g, ' ')
		return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)
	}
	const normalizeMedicationIdentityText = value => normalizeMedicationNameSpacing(value).toLowerCase()

	medicationModule.controller('medicationController', function ($scope, $rootScope, $attrs, $http, $q, jsonDataService, psApiService) {
		const vm = this
		$j(document).dblclick(() => console.log($scope))

		$rootScope.getCurrentTime = () => {
			const now = new Date()
			let hours = now.getHours()
			const minutes = String(now.getMinutes()).padStart(2, '0')
			const meridiem = hours >= 12 ? 'PM' : 'AM'

			hours = hours % 12
			hours = hours === 0 ? 12 : hours
			const hourStr = String(hours).padStart(2, '0')

			return `${hourStr}:${minutes} ${meridiem}`
		}

		vm.appData = {
			context: $attrs.ngContext,
			contextTitle: $attrs.ngContext.charAt(0).toUpperCase() + $attrs.ngContext.slice(1),
			curSchoolId: $attrs.ngCurSchoolId,
			curYearId: $attrs.ngCurYearId,
			curStudentDCID: $attrs.ngCurStudentDcid,
			curStudentName: $attrs.ngCurStudentName,
			curUserDcid: $attrs.ngCurUserDcid,
			curDate: $attrs.ngCurDate,
			curTime: $rootScope.getCurrentTime(),
			districtUser: $attrs.ngCurUserSecurityRoles && ($attrs.ngCurUserSecurityRoles.split(',').includes('9') || $attrs.ngCurUserSecurityRoles.split(',').includes('6')),
			isTestServer: $attrs.ngServerName && $attrs.ngServerName.indexOf('.test.') !== -1,
			unitList: { mg: '(MG) Milligrams ', ml: '(ML) Milliliters', units: 'Units', pills: 'Pills', other: 'Other' },
			inventoryUnitList: {
				Pill: 'Pill',
				Tablet: 'Tablet',
				Capsule: 'Capsule',
				'(ML) Milliliters': '(ML) Milliliters',
				'(MG) Milligrams': '(MG) Milligrams',
				Units: 'Units',
				Other: 'Other'
			},
			routeList: { oral: 'Oral', nasal: 'Nasal', sublingual: 'Sublingual', subcutaneous: 'Subcutaneous', rectal: 'Rectal', other: 'Other' },
			frequencyList: { daily: 'Daily', other: 'Other' },
			inventoryTransactionTypeList: {
				ADDED_IN_ERROR: 'Added in Error',
				PARENT_PICKUP: 'Parent Pickup',
				DISPOSAL: 'Disposal',
				LOST_DAMAGED: 'Lost or Damaged',
				OTHER_REMOVAL: 'Other Removal'
			}
		}

		$rootScope.appData = vm.appData
		$rootScope.existingMedicationList = []
		vm.transactionTypeLabel = transactionType => {
			if (transactionType === 'REVERSAL') return 'Reversal'
			return vm.appData.inventoryTransactionTypeList[transactionType] || transactionType
		}
		vm.beginTransactionDrawer = () => loadingDialog()

		const parseJsonArray = value => {
			if (Array.isArray(value)) return value
			if (typeof value !== 'string') return []
			try {
				return JSON.parse(value)
			} catch (error) {
				return []
			}
		}

		const applyInventoryStatus = medication => {
			const quantityRemaining = Math.max(0, Number(medication.inventory_total_remaining) || 0)
			const storedBaselineQuantity = Number(medication.inventory_baseline_quantity)
			const historicalInventoryQuantity = Number(medication.inventory_total_initial)
			const baselineQuantity = storedBaselineQuantity > 0
				? storedBaselineQuantity
				: (historicalInventoryQuantity > 0 ? historicalInventoryQuantity : quantityRemaining)

			if (quantityRemaining <= 0) {
				medication.inventory_percentage_remaining = 0
				medication.inventory_status = 'OUT'
				medication.inventory_status_label = 'Out of Inventory'
				medication.inventory_status_row_class = 'inventory-warning-out'
				return
			}

			const percentageRemaining = Math.min(100, Math.max(0, (quantityRemaining / baselineQuantity) * 100))

			medication.inventory_percentage_remaining = Number(percentageRemaining.toFixed(1))

			if (percentageRemaining <= CRITICAL_INVENTORY_PERCENTAGE) {
				medication.inventory_status = 'CRITICAL'
				medication.inventory_status_label = 'Critical Inventory'
				medication.inventory_status_row_class = 'inventory-warning-critical'
			} else if (percentageRemaining <= LOW_INVENTORY_PERCENTAGE) {
				medication.inventory_status = 'LOW'
				medication.inventory_status_label = 'Low Inventory'
				medication.inventory_status_row_class = 'inventory-warning-low'
			} else {
				medication.inventory_status = 'NORMAL'
				medication.inventory_status_label = 'Normal'
				medication.inventory_status_row_class = ''
			}
		}

		const prepareMedicationData = (medications, transactions) => {
			const transactionRows = Array.isArray(transactions) ? transactions : []

			return (medications || []).map(medication => {
				medication.inventory_batches = parseJsonArray(medication.inventory_batches)
				medication.inventory_transactions = transactionRows.filter(transaction =>
					Number(transaction.medication_id) === Number(medication.medication_id)
				)

				let quantityToConsume = Math.max(0, -medication.inventory_transactions.reduce(
					(total, transaction) => total + (Number(transaction.quantity_change) || 0),
					0
				))
				const sortedBatches = medication.inventory_batches.slice().sort((left, right) => {
					const dateComparison = String(left.added_date || '').localeCompare(String(right.added_date || ''))
					return dateComparison || Number(left.inventory_id) - Number(right.inventory_id)
				})

				sortedBatches.forEach(batch => {
					const quantityAdded = Number(batch.quantity_added) || 0
					const quantityConsumed = Math.min(quantityAdded, quantityToConsume)
					batch.quantity_remaining = Number((quantityAdded - quantityConsumed).toFixed(10))
					quantityToConsume = Number((quantityToConsume - quantityConsumed).toFixed(10))
				})
				medication.inventory_total_remaining = medication.inventory_batches.reduce(
					(total, batch) => total + (Number(batch.quantity_remaining) || 0),
					0
				)
				applyInventoryStatus(medication)

				const reversedTransactionIds = new Set(
					medication.inventory_transactions
						.map(transaction => Number(transaction.reversal_of_transaction_id))
						.filter(transactionId => Number.isFinite(transactionId) && transactionId > 0)
				)

				medication.inventory_transactions.forEach(transaction => {
					transaction.is_reversed = reversedTransactionIds.has(Number(transaction.transaction_id))
				})

				return medication
			})
		}

		$rootScope.loadData = () => {
			loadingDialog()
			const paramValues = {
				curStudentDCID: vm.appData.curStudentDCID,
				curSchoolID: vm.appData.curSchoolId,
				yearID: vm.appData.curYearId
			}

			vm[`${$rootScope.appData.context}List`] = []

			const staffPromise = $q.when(jsonDataService.getData('staff', { curSchoolID: paramValues.curSchoolID })).then(staffList => {
				$rootScope.appData.staffList = staffList
			})

			const medicationPromise = $http({
				url: `./data/${$rootScope.appData.context}.json`,
				method: 'GET',
				params: paramValues
			}).then(res => Array.isArray(res?.data) ? psUtils.htmlEntitiesToCharCode(res.data) : [])

			const transactionPromise = $http({
				url: './data/inventoryTransactions.json',
				method: 'GET',
				params: paramValues
			}).then(res => Array.isArray(res?.data) ? psUtils.htmlEntitiesToCharCode(res.data) : [])

			const dataPromise = $q.all([medicationPromise, transactionPromise]).then(results => {
				const medicationList = prepareMedicationData(results[0], results[1])
				vm[`${$rootScope.appData.context}List`] = medicationList
				$rootScope.existingMedicationList = medicationList
			})

			$q.all([staffPromise, dataPromise]).finally(() => {
				closeLoading()
			})
		}

		$rootScope.reloadData = () => {
			vm[`${$rootScope.appData.context}List`] = []
			$rootScope.loadData()
		}

		$rootScope.loadData()
	})

	medicationModule.controller('editController', function ($scope, $rootScope, $q, $timeout, formatService, psApiService) {
		const vm = this
		const recordKey = `${$rootScope.appData.context}Record`
		vm[recordKey] = {}
		vm.medicationRecord = vm[recordKey]
		vm.currentMedicationId = null
		vm.isEditMode = false
		vm.removalMedication = null
		vm.drawerMode = 'edit'
		vm.transactionOpenedFromEdit = false
		vm.transactionRecord = {}
		vm.transactionTypeLabel = transactionType => {
			if (transactionType === 'REVERSAL') return 'Reversal'
			return $rootScope.appData.inventoryTransactionTypeList[transactionType] || transactionType
		}
		const createInventoryRow = () => ({
			added_date: $rootScope.appData.curDate,
			users_dcid: $rootScope.appData.curUserDcid,
			_isExisting: false
		})

		const withInventoryDefaults = row => Object.assign(createInventoryRow(), row || {})

		const normalizeInventoryRows = () => {
			vm.inventoryRecord = [withInventoryDefaults((vm.inventoryRecord && vm.inventoryRecord[0]) || {})]
			vm.additionalInventoryRows = (vm.additionalInventoryRows || []).map(withInventoryDefaults)
		}

		const ensureFirstInventoryRowDefaults = () => {
			normalizeInventoryRows()
			vm.inventoryRecord[0].added_date = vm.inventoryRecord[0].added_date || $rootScope.appData.curDate
			vm.inventoryRecord[0].users_dcid = vm.inventoryRecord[0].users_dcid || $rootScope.appData.curUserDcid
		}

		const resetInventoryRows = () => {
			vm.inventoryRecord = [createInventoryRow()]
			vm.additionalInventoryRows = []
			ensureFirstInventoryRowDefaults()
		}

		const parseInventoryBatches = inventoryBatches => {
			if (typeof inventoryBatches === 'string') {
				try {
					return JSON.parse(inventoryBatches)
				} catch (e) {
					return []
				}
			}
			return Array.isArray(inventoryBatches) ? inventoryBatches : []
		}

		const sortInventoryBatches = inventoryBatches => {
			const rows = Array.isArray(inventoryBatches) ? inventoryBatches.slice() : []
			return rows.sort((a, b) => {
				const aDate = ((a && a.added_date) || '').toString()
				const bDate = ((b && b.added_date) || '').toString()

				if (aDate === bDate) return 0
				return aDate < bDate ? -1 : 1
			})
		}

		const normalizeIncomingInventoryRow = row => {
			const normalizedRow = Object.assign({}, row || {})
			const addedDate = normalizedRow.added_date
			const inventoryId = normalizedRow.inventory_id

			if (addedDate) {
				normalizedRow.added_date = formatService.formatDateFromApi(formatService.stripTimeFromIsoDate(addedDate))
			}

			if (normalizedRow.users_dcid !== undefined && normalizedRow.users_dcid !== null && normalizedRow.users_dcid !== '') {
				normalizedRow.users_dcid = String(normalizedRow.users_dcid)
			}

			if (inventoryId !== undefined && inventoryId !== null && inventoryId !== '') {
				normalizedRow.inventory_id = Number(inventoryId)
			}

			normalizedRow._isExisting = true

			return normalizedRow
		}

		const hydrateInventoryRowsForEdit = inventoryBatches => {
			resetInventoryRows()
			if (inventoryBatches.length > 0) {
				vm.inventoryRecord[0] = withInventoryDefaults(inventoryBatches[0])
				vm.additionalInventoryRows = inventoryBatches.slice(1).map(withInventoryDefaults)
			}
			ensureFirstInventoryRowDefaults()
		}
		resetInventoryRows()

		const hasValue = value => value !== undefined && value !== null && value !== ''
		const isDecimalNumber = value => {
			if (!hasValue(value)) return false
			const normalizedValue = String(value).trim()
			return /^(?:\d+\.?\d*|\.\d+)$/.test(normalizedValue) && Number.isFinite(Number(normalizedValue))
		}
		const isPositiveNumber = value => isDecimalNumber(value) && Number(value) > 0
		vm.normalizeMedicationName = () => {
			const record = vm.medicationRecord || vm[recordKey] || {}
			record.medication_name = normalizeMedicationNameSpacing(record.medication_name)
			vm.checkReqFields()
		}
		vm.duplicateMedicationExists = () => {
			const record = vm.medicationRecord || vm[recordKey] || {}
			const medicationName = normalizeMedicationIdentityText(record.medication_name)
			const doseUnit = normalizeMedicationIdentityText(record.dose_unit)
			const doseAmount = Number(record.dose_amount)
			const currentMedicationId = record.medication_id || vm.currentMedicationId

			if (!medicationName || !doseUnit || !Number.isFinite(doseAmount) || doseAmount <= 0) return false

			return ($rootScope.existingMedicationList || []).some(existingMedication => {
				if (currentMedicationId && Number(existingMedication.medication_id) === Number(currentMedicationId)) return false

				return normalizeMedicationIdentityText(existingMedication.medication_name) === medicationName &&
					Number(existingMedication.dose_amount) === doseAmount &&
					normalizeMedicationIdentityText(existingMedication.dose_unit) === doseUnit
			})
		}
		const isInventoryRowValid = row => {
			if (row && row._isExisting) return true
			if (!row || !isPositiveNumber(row.quantity_added) || !row.added_date || !row.users_dcid) return false
			return true
		}

		vm.isFormValid = () => {
			const record = vm.medicationRecord || vm[recordKey] || {}
			const inventoryRows = [vm.inventoryRecord && vm.inventoryRecord[0]].concat(vm.additionalInventoryRows || [])
			const medicationIsValid = normalizeMedicationNameSpacing(record.medication_name) && record.created_date && isPositiveNumber(record.dose_amount) &&
				record.dose_unit && record.inventory_unit && record.route && record.frequency

			return Boolean(medicationIsValid && !vm.duplicateMedicationExists() && inventoryRows.length && inventoryRows.every(isInventoryRowValid))
		}

		const resetTransactionRecord = () => {
			vm.transactionRecord = {
				transaction_type: '',
				event_date: $rootScope.appData.curDate,
				users_dcid: $rootScope.appData.curUserDcid,
				notes: ''
			}
		}

		const drawerTitleForMode = mode => {
			if (mode === 'remove') return 'Remove Inventory'
			return vm.isEditMode ? 'Edit Inventory' : 'Add Medication'
		}

		const updateDrawerTitle = mode => {
			const formElement = document.getElementById('med-inv-form')
			const drawerElement = formElement && formElement.closest ? formElement.closest('.ui-dialog') : null
			const titleElement = drawerElement ? drawerElement.querySelector('.ui-dialog-title') : null
			if (titleElement) titleElement.textContent = drawerTitleForMode(mode)
		}

		const buildTransactionPayload = () => {
			return {
				u_student_medication_id: vm.removalMedication.medication_id,
				transaction_type: vm.transactionRecord.transaction_type,
				quantity_change: -Number(vm.transactionRecord.quantity),
				event_date: vm.transactionRecord.event_date,
				users_dcid: vm.transactionRecord.users_dcid,
				notes: vm.transactionRecord.notes,
				dateKeys: ['_date']
			}
		}

		vm.isTransactionValid = () => {
			const record = vm.transactionRecord || {}
			const commonFieldsAreValid = record.event_date && record.users_dcid && record.notes && record.notes.trim()
			if (!commonFieldsAreValid) return false

			const quantityText = String(record.quantity === undefined || record.quantity === null ? '' : record.quantity).trim()
			const quantity = Number(quantityText)
			const quantityIsValid = /^(?:\d+\.?\d*|\.\d+)$/.test(quantityText) && Number.isFinite(quantity) && quantity > 0
			return Boolean(record.transaction_type && quantityIsValid && quantity <= Number(vm.removalMedication.inventory_total_remaining))
		}

		vm.removalQuantityExceedsAvailable = () => {
			const record = vm.transactionRecord || {}
			const quantityText = String(record.quantity === undefined || record.quantity === null ? '' : record.quantity).trim()
			if (!/^(?:\d+\.?\d*|\.\d+)$/.test(quantityText)) return false
			return Number(quantityText) > Number(vm.removalMedication && vm.removalMedication.inventory_total_remaining)
		}

		vm.enterRemovalMode = () => {
			loadingDialog()
			vm.transactionOpenedFromEdit = true
			vm.drawerMode = 'remove'
			resetTransactionRecord()
			$timeout(() => {
				updateDrawerTitle(vm.drawerMode)
				vm.checkReqFields()
				closeLoading()
			})
		}

		vm.returnToEditMode = () => {
			vm.drawerMode = 'edit'
			vm.transactionOpenedFromEdit = false
			resetTransactionRecord()
			updateDrawerTitle(vm.drawerMode)
			vm.checkReqFields()
		}

		vm.hasExistingInventory = () => Boolean(vm.isEditMode)
		vm.hasExistingInventoryLines = () => Boolean(
			vm.isEditMode &&
			vm.removalMedication &&
			Array.isArray(vm.removalMedication.inventory_batches) &&
			vm.removalMedication.inventory_batches.length
		)
		vm.hasPendingInventoryRows = () => (vm.additionalInventoryRows || []).some(row => row && !row._isExisting)

		vm.addInventoryRecord = () => {
			vm.additionalInventoryRows.push(createInventoryRow())
			ensureFirstInventoryRowDefaults()
			vm.checkReqFields()
		}

		vm.cancelAdditionalInventory = row => {
			if (!row || row._isExisting) return
			vm.additionalInventoryRows = (vm.additionalInventoryRows || []).filter(candidate => candidate !== row)
			vm.checkReqFields()
		}

		$scope.$watch(
			() => vm.medicationRecord,
			() => {
				vm.checkReqFields()
			},
			true
		)

		const initalizeDrawer = () => {
			$scope.$emit('open.drawer.event', openDrawer)
			$scope.$emit('cancel.drawer.event', cancelDrawer)
			$scope.$emit('save.drawer.event', saveDrawer)
		}

		const formatKeys = {
			dateKeys: ['_date', 'added_date'],
			timeKeys: ['_time']
		}

		const cancelDrawer = closeDrawer => {
			if (vm.drawerMode !== 'edit' && vm.transactionOpenedFromEdit) {
				$timeout(() => vm.returnToEditMode())
				return
			}

			loadingDialog()
			vm[recordKey] = {}
			vm.medicationRecord = vm[recordKey]
			vm.currentMedicationId = null
			vm.isEditMode = false
			vm.removalMedication = null
			vm.drawerMode = 'edit'
			vm.transactionOpenedFromEdit = false
			resetInventoryRows()
			$rootScope.reloadData()
			closeLoading()
			closeDrawer(true)
			closeDrawer()
		}

		const openDrawer = (openCallBack, data) => {
			const drawerData = (data && data.data) || {}
			const requestedMode = drawerData.mode === 'remove' ? 'remove' : 'edit'
			const medicationData = drawerData.medication || drawerData
			vm.drawerMode = requestedMode
			vm.transactionOpenedFromEdit = false
			resetTransactionRecord()

			if (medicationData.medication_id == null) {
				vm.currentMedicationId = null
				vm.isEditMode = false
				vm.removalMedication = null
				vm.drawerMode = 'edit'
				const record = vm.medicationRecord || vm[recordKey] || {}
				resetInventoryRows()
				ensureFirstInventoryRowDefaults()
				delete record.inventory
				record.created_date = $rootScope.appData.curDate
				record.users_dcid = $rootScope.appData.curUserDcid
				record.studentsdcid = $rootScope.appData.curStudentDCID
				record.schoolid = $rootScope.appData.curSchoolId
				record.yearid = $rootScope.appData.curYearId
				vm[recordKey] = record
				vm.medicationRecord = record
			} else {
				vm.removalMedication = medicationData
				const sourceRecord = Object.assign({}, medicationData)
				vm.currentMedicationId = sourceRecord.medication_id || null
				vm.isEditMode = true
				formatService.objIterator(sourceRecord, formatKeys.dateKeys, 'stripTimeFromIsoDate')
				formatService.objIterator(sourceRecord, formatKeys.dateKeys, 'formatDateFromApi')

				const inventoryBatches = sortInventoryBatches(parseInventoryBatches(sourceRecord.inventory_batches)).map(normalizeIncomingInventoryRow)
				hydrateInventoryRowsForEdit(inventoryBatches)

				delete sourceRecord.inventory
				delete sourceRecord.inventory_batches
				delete sourceRecord.inventory_transactions
				vm[recordKey] = sourceRecord
				vm.medicationRecord = vm[recordKey]

				vm._lastOpenedInventoryBatches = inventoryBatches
			}
			vm.checkReqFields()
			openCallBack()
			$timeout(() => {
				if (vm.hasExistingInventory() && Array.isArray(vm._lastOpenedInventoryBatches)) {
					hydrateInventoryRowsForEdit(vm._lastOpenedInventoryBatches)
				}
				ensureFirstInventoryRowDefaults()
				updateDrawerTitle(vm.drawerMode)
				vm.checkReqFields()
				closeLoading()
			})
		}

		const saveInventoryTransaction = closeDrawer => {
			if (!vm.isTransactionValid()) {
				psAlert({
					title: 'Invalid Inventory Transaction',
					message: 'Enter a valid quantity that does not exceed the available inventory and complete the date, staff member, and notes.'
				})
				return
			}

			const payload = buildTransactionPayload()

			loadingDialog()
			return psApiService.psApiCall('u_student_med_inv_txn', 'POST', payload)
				.then(() => {
					$rootScope.reloadData()
					closeLoading()
					closeDrawer(true)
				})
				.catch(() => closeLoading())
		}

		const saveDrawer = (closeDrawer, data) => {
			if (vm.drawerMode !== 'edit') return saveInventoryTransaction(closeDrawer)
			vm.normalizeMedicationName()
			loadingDialog()

			if (vm.duplicateMedicationExists()) {
				closeLoading()
				$scope.$emit('drawer.disable.save.button')
				return
			}

			if (!vm.isFormValid()) {
				closeLoading()
				$scope.$emit('drawer.disable.save.button')
				psAlert({
					title: 'Invalid Medication Inventory',
					message: 'Enter a valid positive dosage and complete inventory information. Inventory quantities must be numeric and quantity added must be greater than zero.'
				})
				return
			}

			const medicationPayload = Object.assign({}, vm.medicationRecord || vm[recordKey] || {})
			const existingMedicationId = medicationPayload.medication_id || vm.currentMedicationId || (data && data.data && data.data.medication_id) || null
			const inventoryRows = [vm.inventoryRecord && vm.inventoryRecord[0]].concat(vm.additionalInventoryRows || [])
			const newInventoryQuantity = inventoryRows.reduce((total, row) => {
				if (!row || row._isExisting) return total
				return total + (Number(row.quantity_added) || 0)
			}, 0)
			const currentInventoryRemaining = existingMedicationId && vm.removalMedication
				? Number(vm.removalMedication.inventory_total_remaining) || 0
				: 0

			if (!existingMedicationId || newInventoryQuantity > 0) {
				medicationPayload.inventory_baseline_quantity = Number((currentInventoryRemaining + newInventoryQuantity).toFixed(10))
			} else if (!(Number(medicationPayload.inventory_baseline_quantity) > 0) && currentInventoryRemaining > 0) {
				medicationPayload.inventory_baseline_quantity = currentInventoryRemaining
			}
			delete medicationPayload.inventory
			delete medicationPayload.inventory_batches
			delete medicationPayload.inventory_total_initial
			delete medicationPayload.inventory_total_remaining
			delete medicationPayload.inventory_transactions
			delete medicationPayload.inventory_percentage_remaining
			delete medicationPayload.inventory_status
			delete medicationPayload.inventory_status_label
			delete medicationPayload.inventory_status_row_class
			formatService.objIterator(medicationPayload, formatKeys.dateKeys, 'formatDateForApi')

			const getMedicationIdFromResponse = response => {
				if (!response) return null

				if (Array.isArray(response)) {
					const first = response[0] || {}
					return (first.success_message && first.success_message.id) || first.id || null
				}

				if (response.result && response.result[0] && response.result[0].success_message && response.result[0].success_message.id) {
					return response.result[0].success_message.id
				}

				if (response.success_message && response.success_message.id) return response.success_message.id
				if (response.id) return response.id
				return null
			}

			const buildInventoryPayloads = medicationId => {
				const inventoryRows = [vm.inventoryRecord[0]].concat(vm.additionalInventoryRows || [])
				return inventoryRows
					.filter(row => row && row.quantity_added !== undefined && row.quantity_added !== null && row.quantity_added !== '')
					.map(row => {
						const inventoryPayload = {
							inventory_id: row.inventory_id,
							_isExisting: !!row._isExisting,
							u_student_medication_id: medicationId,
							added_date: row.added_date,
							users_dcid: row.users_dcid,
							quantity_added: row.quantity_added,
							notes: row.notes
						}
						return inventoryPayload
					})
			}

			const normalizeInventoryDatesForApi = payloads => {
				return (payloads || []).map(payload => {
					const normalized = Object.assign({}, payload)
					const value = normalized.added_date

					if (value && typeof value === 'string') {
						if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
							normalized.added_date = formatService.formatDateForApi(value)
						}
					} else if (value) {
						normalized.added_date = formatService.formatDateForApi(value)
					}

					return normalized
				})
			}

			let savePromise

			if (existingMedicationId) {
				let recordId = existingMedicationId
				delete medicationPayload['medication_id']
				delete medicationPayload['studentsdcid']

				savePromise = psApiService.psApiCall('u_student_medication', 'PUT', medicationPayload, recordId)
			} else {
				savePromise = psApiService.psApiCall('u_student_medication', 'POST', medicationPayload)
			}

			return $q
				.when(savePromise)
				.then(response => {
					const medicationId = existingMedicationId || getMedicationIdFromResponse(response)
					const inventoryPayloads = buildInventoryPayloads(medicationId)
					const inventoryPayloadsForApi = normalizeInventoryDatesForApi(inventoryPayloads)

					if (!medicationId || !inventoryPayloadsForApi.length) {
						console.warn('Inventory submit skipped', {
							medicationId,
							inventoryRecord: vm.inventoryRecord,
							additionalInventoryRows: vm.additionalInventoryRows
						})
						return null
					}

					if (!existingMedicationId) {
						return $q.all(
							inventoryPayloadsForApi.map(payload => {
								const createPayload = Object.assign({}, payload)
								delete createPayload.inventory_id
								delete createPayload._isExisting
								return psApiService.psApiCall('u_student_medication_inventory', 'POST', createPayload)
							})
						)
					}

					const createCalls = []

					inventoryPayloadsForApi.forEach(payload => {
						if (!payload._isExisting) {
							const createPayload = Object.assign({}, payload)
							delete createPayload.inventory_id
							delete createPayload._isExisting
							createCalls.push(psApiService.psApiCall('u_student_medication_inventory', 'POST', createPayload))
						}
					})

					return $q.all(createCalls)
				})
				.then(() => {
					vm[recordKey] = {}
					vm.medicationRecord = vm[recordKey]
					vm.currentMedicationId = null
					vm.isEditMode = false
					vm.removalMedication = null
					vm.drawerMode = 'edit'
					resetInventoryRows()
					$rootScope.reloadData()
					closeLoading()
					closeDrawer(true)
				})
				.catch(() => {
					closeLoading()
				})
		}
		// checks required fields and enables save button if all required fields are filled out
		vm.checkReqFields = () => {
			const isValid = vm.drawerMode === 'edit' ? vm.isFormValid() : vm.isTransactionValid()
			$scope.$emit(isValid ? 'drawer.enable.save.button' : 'drawer.disable.save.button')
		}

		vm.resetSeasonForm = closeDrawer => {
			vm[recordKey] = {}
			vm.medicationRecord = vm[recordKey]
			vm.currentMedicationId = null
			vm.isEditMode = false
			vm.removalMedication = null
			vm.drawerMode = 'edit'
			resetInventoryRows()
			$rootScope.reloadData()
			closeLoading()
			closeDrawer()
		}
		initalizeDrawer()
	})

	medicationModule.filter('pluralize', () => val => {
		if (!val) return val
		return val.slice(-1) === 's' ? val : val + 's'
	})

})
