define(['angular', 'components/shared/powerschoolModule', 'components/health_log/module', 'components/health_log/services/formatService', 'components/health_log/services/jsonDataService', 'components/health_log/services/psApiService'], angular => {
	'use strict'
	const medicationModule = angular.module('medicationModule', ['powerSchoolModule', 'healthLogMod'])

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
		vm.transactionTypeLabel = transactionType => {
			if (transactionType === 'REVERSAL') return 'Reversal'
			if (transactionType === 'SYSTEM_ROLLBACK') return 'Automatic Rollback'
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

		const prepareMedicationData = (medications, transactions) => {
			const transactionRows = Array.isArray(transactions) ? transactions : []

			return (medications || []).map(medication => {
				medication.inventory_batches = parseJsonArray(medication.inventory_batches)
				medication.inventory_transactions = transactionRows.filter(transaction =>
					Number(transaction.medication_id) === Number(medication.medication_id)
				)

				const inventoryChanges = medication.inventory_transactions.reduce((changes, transaction) => {
					const inventoryId = Number(transaction.inventory_id)
					changes[inventoryId] = (changes[inventoryId] || 0) + (Number(transaction.quantity_change) || 0)
					return changes
				}, {})

				medication.inventory_batches.forEach(batch => {
					batch.quantity_remaining = (Number(batch.quantity_remaining) || 0) + (inventoryChanges[Number(batch.inventory_id)] || 0)
				})
				medication.inventory_total_remaining = medication.inventory_batches.reduce(
					(total, batch) => total + (Number(batch.quantity_remaining) || 0),
					0
				)

				const groups = {}

				medication.inventory_transactions.forEach(transaction => {
					const eventKey = transaction.event_key || `transaction-${transaction.transaction_id}`
					if (!groups[eventKey]) {
						groups[eventKey] = {
							event_key: eventKey,
							transaction_type: transaction.transaction_type,
							transaction_date: transaction.transaction_date,
							transaction_time: transaction.transaction_time,
							user_name: transaction.user_name,
							notes: transaction.notes,
							reversal_of_event_key: transaction.reversal_of_event_key,
							quantity_change: 0,
							rows: []
						}
					}
					groups[eventKey].quantity_change += Number(transaction.quantity_change) || 0
					groups[eventKey].rows.push(transaction)
				})

				const transactionGroups = Object.values(groups)
				const directlyReversedEventKeys = new Set(transactionGroups.map(group => group.reversal_of_event_key).filter(Boolean))
				const effectivelyReversedEventKeys = new Set(
					transactionGroups
						.filter(group => group.reversal_of_event_key && !directlyReversedEventKeys.has(group.event_key))
						.map(group => group.reversal_of_event_key)
				)

				medication.transaction_groups = transactionGroups.map(group => {
					group.is_reversed = effectivelyReversedEventKeys.has(group.event_key)
					group.can_reverse = group.transaction_type !== 'REVERSAL' && !group.is_reversed
					if (group.transaction_type === 'SYSTEM_ROLLBACK') group.can_reverse = false
					return group
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
				vm[`${$rootScope.appData.context}List`] = prepareMedicationData(results[0], results[1])
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
		vm.sourceTransaction = null
		vm.transactionRecord = {}
		vm.transactionTypeLabel = transactionType => {
			if (transactionType === 'REVERSAL') return 'Reversal'
			if (transactionType === 'SYSTEM_ROLLBACK') return 'Automatic Rollback'
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

			if ((normalizedRow.quantity_added === undefined || normalizedRow.quantity_added === null || normalizedRow.quantity_added === '') && normalizedRow.quantity_remaining !== undefined && normalizedRow.quantity_remaining !== null && normalizedRow.quantity_remaining !== '') {
				normalizedRow.quantity_added = normalizedRow.quantity_remaining
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
		const isNonNegativeNumber = value => isDecimalNumber(value) && Number(value) >= 0

		const isInventoryRowValid = row => {
			if (row && row._isExisting) return true
			if (!row || !isPositiveNumber(row.quantity_added) || !row.added_date || !row.users_dcid) return false

			if (hasValue(row.quantity_remaining)) {
				return isNonNegativeNumber(row.quantity_remaining) && Number(row.quantity_remaining) <= Number(row.quantity_added)
			}

			return true
		}

		vm.isFormValid = () => {
			const record = vm.medicationRecord || vm[recordKey] || {}
			const inventoryRows = [vm.inventoryRecord && vm.inventoryRecord[0]].concat(vm.additionalInventoryRows || [])
			const medicationIsValid = record.medication_name && record.created_date && isPositiveNumber(record.dose_amount) && record.dose_unit && record.inventory_unit && record.route && record.frequency

			return Boolean(medicationIsValid && inventoryRows.length && inventoryRows.every(isInventoryRowValid))
		}

		const createEventKey = () => {
			if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
				const randomValue = Math.random() * 16 | 0
				const value = character === 'x' ? randomValue : (randomValue & 0x3 | 0x8)
				return value.toString(16)
			})
		}

		const resetTransactionRecord = () => {
			vm.transactionRecord = {
				transaction_type: '',
				transaction_date: $rootScope.appData.curDate,
				transaction_time: $rootScope.appData.curTime,
				users_dcid: $rootScope.appData.curUserDcid,
				notes: ''
			}
		}

		const drawerTitleForMode = mode => {
			if (mode === 'remove') return 'Remove Inventory'
			if (mode === 'reverse') return 'Reverse Inventory Transaction'
			return vm.isEditMode ? 'Edit Inventory' : 'Add Inventory'
		}

		const updateDrawerTitle = mode => {
			const formElement = document.getElementById('med-inv-form')
			const drawerElement = formElement && formElement.closest ? formElement.closest('.ui-dialog') : null
			const titleElement = drawerElement ? drawerElement.querySelector('.ui-dialog-title') : null
			if (titleElement) titleElement.textContent = drawerTitleForMode(mode)
		}

		const buildFifoAllocations = quantity => {
			let quantityToAllocate = Number(quantity)
			const allocations = []
			const batches = (vm.removalMedication.inventory_batches || []).slice().sort((left, right) => {
				const dateComparison = String(left.added_date || '').localeCompare(String(right.added_date || ''))
				return dateComparison || Number(left.inventory_id) - Number(right.inventory_id)
			})

			batches.forEach(batch => {
				const available = Number(batch.quantity_remaining) || 0
				if (quantityToAllocate <= 0 || available <= 0) return
				const allocated = Math.min(available, quantityToAllocate)
				allocations.push({ inventory_id: batch.inventory_id, quantity_change: -allocated })
				quantityToAllocate = Number((quantityToAllocate - allocated).toFixed(10))
			})

			return quantityToAllocate === 0 ? allocations : []
		}

		const buildTransactionPayloads = () => {
			const eventKey = createEventKey()
			const allocations = vm.drawerMode === 'reverse'
				? (vm.sourceTransaction.rows || []).map(row => ({
					inventory_id: row.inventory_id,
					quantity_change: -(Number(row.quantity_change) || 0)
				}))
				: buildFifoAllocations(vm.transactionRecord.quantity)

			return allocations.map(allocation => ({
				u_student_medication_id: vm.removalMedication.medication_id,
				inventory_id: allocation.inventory_id,
				event_key: eventKey,
				transaction_type: vm.drawerMode === 'reverse' ? 'REVERSAL' : vm.transactionRecord.transaction_type,
				quantity_change: allocation.quantity_change,
				transaction_date: vm.transactionRecord.transaction_date,
				transaction_time: vm.transactionRecord.transaction_time,
				users_dcid: vm.transactionRecord.users_dcid,
				notes: vm.transactionRecord.notes,
				reversal_of_event_key: vm.drawerMode === 'reverse' ? vm.sourceTransaction.event_key : undefined,
				dateKeys: ['_date'],
				timeKeys: ['_time']
			}))
		}

		const postTransactionPayloads = payloads => {
			const postedPayloads = []
			return payloads
				.reduce((promise, payload) => promise.then(() =>
					psApiService.psApiCall('u_student_med_inv_txn', 'POST', payload).then(() => postedPayloads.push(payload))
				), $q.when())
				.catch(error => {
					if (!postedPayloads.length) return $q.reject(error)

					const rollbackEventKey = createEventKey()
					const rollbackPayloads = postedPayloads.map(payload => ({
						u_student_medication_id: payload.u_student_medication_id,
						inventory_id: payload.inventory_id,
						event_key: rollbackEventKey,
						transaction_type: 'SYSTEM_ROLLBACK',
						quantity_change: -Number(payload.quantity_change),
						transaction_date: payload.transaction_date,
						transaction_time: payload.transaction_time,
						users_dcid: payload.users_dcid,
						notes: `Automatic rollback after an incomplete ${payload.transaction_type} event.`,
						reversal_of_event_key: payload.event_key,
						dateKeys: ['_date'],
						timeKeys: ['_time']
					}))

					return $q.all(rollbackPayloads.map(payload => psApiService.psApiCall('u_student_med_inv_txn', 'POST', payload)))
						.then(() => $q.reject(error), () => $q.reject(error))
				})
		}

		vm.isTransactionValid = () => {
			const record = vm.transactionRecord || {}
			const commonFieldsAreValid = record.transaction_date && record.transaction_time && record.users_dcid && record.notes && record.notes.trim()
			if (!commonFieldsAreValid) return false
			if (vm.drawerMode === 'reverse') return Boolean(vm.sourceTransaction && vm.sourceTransaction.can_reverse)

			const quantityText = String(record.quantity === undefined || record.quantity === null ? '' : record.quantity).trim()
			const quantity = Number(quantityText)
			const quantityIsValid = /^(?:\d+\.?\d*|\.\d+)$/.test(quantityText) && Number.isFinite(quantity) && quantity > 0
			return Boolean(record.transaction_type && quantityIsValid && quantity <= Number(vm.removalMedication.inventory_total_remaining))
		}

		vm.enterRemovalMode = () => {
			loadingDialog()
			vm.transactionOpenedFromEdit = true
			vm.drawerMode = 'remove'
			vm.sourceTransaction = null
			resetTransactionRecord()
			$timeout(() => {
				updateDrawerTitle(vm.drawerMode)
				vm.checkReqFields()
				closeLoading()
			})
		}

		vm.enterReversalMode = transaction => {
			loadingDialog()
			vm.transactionOpenedFromEdit = true
			vm.drawerMode = 'reverse'
			vm.sourceTransaction = transaction
			resetTransactionRecord()
			vm.transactionRecord.quantity = Math.abs(Number(transaction.quantity_change) || 0)
			$timeout(() => {
				updateDrawerTitle(vm.drawerMode)
				vm.checkReqFields()
				closeLoading()
			})
		}

		vm.returnToEditMode = () => {
			vm.drawerMode = 'edit'
			vm.transactionOpenedFromEdit = false
			vm.sourceTransaction = null
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
			vm.sourceTransaction = null
			resetInventoryRows()
			$rootScope.reloadData()
			closeLoading()
			closeDrawer(true)
			closeDrawer()
		}

		const openDrawer = (openCallBack, data) => {
			const drawerData = (data && data.data) || {}
			const requestedMode = drawerData.mode || 'edit'
			const medicationData = drawerData.medication || drawerData
			vm.drawerMode = requestedMode
			vm.transactionOpenedFromEdit = false
			vm.sourceTransaction = drawerData.transaction || null
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
				delete sourceRecord.transaction_groups
				vm[recordKey] = sourceRecord
				vm.medicationRecord = vm[recordKey]

				vm._lastOpenedInventoryBatches = inventoryBatches
				if (vm.drawerMode === 'reverse' && vm.sourceTransaction) {
					vm.transactionRecord.quantity = Math.abs(Number(vm.sourceTransaction.quantity_change) || 0)
				}
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

			const payloads = buildTransactionPayloads()
			if (!payloads.length) {
				psAlert({ title: 'Insufficient Inventory', message: 'The requested quantity could not be allocated from the available inventory lots.' })
				return
			}

			loadingDialog()
			return postTransactionPayloads(payloads)
				.then(() => {
					$rootScope.reloadData()
					closeLoading()
					closeDrawer(true)
				})
				.catch(() => closeLoading())
		}

		const saveDrawer = (closeDrawer, data) => {
			if (vm.drawerMode !== 'edit') return saveInventoryTransaction(closeDrawer)
			loadingDialog()

			if (!vm.isFormValid()) {
				closeLoading()
				$scope.$emit('drawer.disable.save.button')
				psAlert({
					title: 'Invalid Medication Inventory',
					message: 'Enter a valid positive dosage and complete inventory information. Inventory quantities must be numeric, quantity added must be greater than zero, and quantity remaining cannot exceed quantity added.'
				})
				return
			}

			const medicationPayload = Object.assign({}, vm.medicationRecord || vm[recordKey] || {})
			const existingMedicationId = medicationPayload.medication_id || vm.currentMedicationId || (data && data.data && data.data.medication_id) || null
			delete medicationPayload.inventory
			delete medicationPayload.inventory_batches
			delete medicationPayload.inventory_total_initial
			delete medicationPayload.inventory_total_remaining
			delete medicationPayload.inventory_transactions
			delete medicationPayload.transaction_groups
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
							quantity_remaining: row.quantity_remaining !== undefined && row.quantity_remaining !== null && row.quantity_remaining !== '' ? row.quantity_remaining : row.quantity_added,
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
					vm.sourceTransaction = null
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
			vm.sourceTransaction = null
			resetInventoryRows()
			$rootScope.reloadData()
			closeLoading()
			closeDrawer()
		}
		initalizeDrawer()
	})

	medicationModule.controller('inventoryTransactionController', function ($scope, $rootScope, $q, formatService, psApiService) {
		const vm = this
		vm.mode = 'remove'
		vm.medication = {}
		vm.sourceTransaction = null
		vm.transactionRecord = {}

		const createEventKey = () => {
			if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
				const randomValue = Math.random() * 16 | 0
				const value = character === 'x' ? randomValue : (randomValue & 0x3 | 0x8)
				return value.toString(16)
			})
		}

		const reset = () => {
			vm.transactionRecord = {
				transaction_type: '',
				transaction_date: $rootScope.appData.curDate,
				transaction_time: $rootScope.appData.curTime,
				users_dcid: $rootScope.appData.curUserDcid,
				notes: ''
			}
		}

		const buildFifoAllocations = quantity => {
			let quantityToAllocate = Number(quantity)
			const allocations = []
			const batches = (vm.medication.inventory_batches || []).slice().sort((left, right) => {
				const dateComparison = String(left.added_date || '').localeCompare(String(right.added_date || ''))
				return dateComparison || Number(left.inventory_id) - Number(right.inventory_id)
			})

			batches.forEach(batch => {
				const available = Number(batch.quantity_remaining) || 0
				if (quantityToAllocate <= 0 || available <= 0) return
				const allocated = Math.min(available, quantityToAllocate)
				allocations.push({ inventory_id: batch.inventory_id, quantity_change: -allocated })
				quantityToAllocate = Number((quantityToAllocate - allocated).toFixed(10))
			})

			return quantityToAllocate === 0 ? allocations : []
		}

		const buildTransactionPayloads = () => {
			const eventKey = createEventKey()
			let allocations

			if (vm.mode === 'reverse') {
				allocations = (vm.sourceTransaction.rows || []).map(row => ({
					inventory_id: row.inventory_id,
					quantity_change: -(Number(row.quantity_change) || 0)
				}))
			} else {
				allocations = buildFifoAllocations(vm.transactionRecord.quantity)
			}

			return allocations.map(allocation => ({
				u_student_medication_id: vm.medication.medication_id,
				inventory_id: allocation.inventory_id,
				event_key: eventKey,
				transaction_type: vm.mode === 'reverse' ? 'REVERSAL' : vm.transactionRecord.transaction_type,
				quantity_change: allocation.quantity_change,
				transaction_date: vm.transactionRecord.transaction_date,
				transaction_time: vm.transactionRecord.transaction_time,
				users_dcid: vm.transactionRecord.users_dcid,
				notes: vm.transactionRecord.notes,
				reversal_of_event_key: vm.mode === 'reverse' ? vm.sourceTransaction.event_key : undefined,
				dateKeys: ['_date'],
				timeKeys: ['_time']
			}))
		}

		const postTransactionPayloads = payloads => {
			const postedPayloads = []
			return payloads
				.reduce((promise, payload) => {
					return promise.then(() => psApiService.psApiCall('u_student_med_inv_txn', 'POST', payload).then(() => {
						postedPayloads.push(payload)
					}))
				}, $q.when())
				.catch(error => {
					if (!postedPayloads.length) return $q.reject(error)

					const rollbackEventKey = createEventKey()
					const rollbackPayloads = postedPayloads.map(payload => ({
						u_student_medication_id: payload.u_student_medication_id,
						inventory_id: payload.inventory_id,
						event_key: rollbackEventKey,
						transaction_type: 'SYSTEM_ROLLBACK',
						quantity_change: -Number(payload.quantity_change),
						transaction_date: payload.transaction_date,
						transaction_time: payload.transaction_time,
						users_dcid: payload.users_dcid,
						notes: `Automatic rollback after an incomplete ${payload.transaction_type} event.`,
						reversal_of_event_key: payload.event_key,
						dateKeys: ['_date'],
						timeKeys: ['_time']
					}))

					return $q.all(rollbackPayloads.map(payload => psApiService.psApiCall('u_student_med_inv_txn', 'POST', payload)))
						.then(() => $q.reject(error), () => $q.reject(error))
				})
		}

		vm.isValid = () => {
			const record = vm.transactionRecord || {}
			const commonFieldsAreValid = record.transaction_date && record.transaction_time && record.users_dcid && record.notes && record.notes.trim()
			if (!commonFieldsAreValid) return false
			if (vm.mode === 'reverse') return Boolean(vm.sourceTransaction && vm.sourceTransaction.can_reverse)
			const quantityText = String(record.quantity === undefined || record.quantity === null ? '' : record.quantity).trim()
			const quantity = Number(quantityText)
			const quantityIsValid = /^(?:\d+\.?\d*|\.\d+)$/.test(quantityText) && Number.isFinite(quantity) && quantity > 0
			return Boolean(record.transaction_type && quantityIsValid && quantity <= Number(vm.medication.inventory_total_remaining))
		}

		vm.checkReqFields = () => {
			$scope.$emit(vm.isValid() ? 'drawer.enable.save.button' : 'drawer.disable.save.button')
		}

		const openDrawer = (openCallBack, data) => {
			const drawerData = data.data || {}
			reset()
			vm.mode = drawerData.mode || 'remove'
			vm.medication = drawerData.medication || {}
			vm.sourceTransaction = drawerData.transaction || null
			if (vm.mode === 'reverse' && vm.sourceTransaction) {
				vm.transactionRecord.quantity = Math.abs(Number(vm.sourceTransaction.quantity_change) || 0)
			}
			vm.checkReqFields()
			openCallBack()
			closeLoading()
		}

		const cancelDrawer = closeDrawer => {
			reset()
			closeDrawer(true)
			closeDrawer()
		}

		const saveDrawer = closeDrawer => {
			if (!vm.isValid()) {
				psAlert({
					title: 'Invalid Inventory Transaction',
					message: 'Enter a valid quantity that does not exceed the available inventory and complete the date, staff member, and notes.'
				})
				return
			}

			const payloads = buildTransactionPayloads()
			if (!payloads.length) {
				psAlert({ title: 'Insufficient Inventory', message: 'The requested quantity could not be allocated from the available inventory lots.' })
				return
			}

			loadingDialog()
			return postTransactionPayloads(payloads)
				.then(() => {
					$rootScope.reloadData()
					closeLoading()
					closeDrawer(true)
				})
				.catch(() => {
					closeLoading()
				})
		}

		$scope.$emit('open.drawer.event', openDrawer)
		$scope.$emit('cancel.drawer.event', cancelDrawer)
		$scope.$emit('save.drawer.event', saveDrawer)
		reset()
	})

	medicationModule.filter('pluralize', () => val => {
		if (!val) return val
		return val.slice(-1) === 's' ? val : val + 's'
	})

	medicationModule.filter('inventoryTime', () => value => {
		const seconds = Number(value)
		if (!Number.isFinite(seconds)) return ''
		const totalMinutes = Math.floor(seconds / 60)
		const hours24 = Math.floor(totalMinutes / 60) % 24
		const minutes = totalMinutes % 60
		const hours12 = hours24 % 12 || 12
		const meridiem = hours24 >= 12 ? 'PM' : 'AM'
		return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`
	})
})
