'use strict'
define(() => {
	const optionTypes = [
		{ codeType: 'MED_DOSE_UNIT', displayName: 'Medication Dose Units', section: 'Medication', medicationField: 'dose_unit' },
		{ codeType: 'MED_INVENTORY_UNIT', displayName: 'Medication Inventory Units', section: 'Medication', medicationField: 'inventory_unit' },
		{ codeType: 'MED_ROUTE', displayName: 'Medication Routes', section: 'Medication', medicationField: 'route' },
		{ codeType: 'MED_FREQUENCY', displayName: 'Medication Frequencies', section: 'Medication', medicationField: 'frequency' },
		{ codeType: 'HEALTH_COMPLAINT', displayName: 'Health Log Complaints', section: 'Health Log' },
		{ codeType: 'HEALTH_DESTINATION', displayName: 'Health Log Destinations', section: 'Health Log' },
		{ codeType: 'HEALTH_CONVERSATION', displayName: 'Health Log Conversation Types', section: 'Health Log' },
		{ codeType: 'HEALTH_SPORT', displayName: 'Health Log Sports', section: 'Health Log' }
	]
	const medicationTypes = optionTypes.reduce((types, optionType) => {
		if (!optionType.medicationField) return types
		types[optionType.medicationField] = {
			codeType: optionType.codeType,
			modelValueField: 'code'
		}
		return types
	}, {})
	const fieldValue = (record, camelCaseKey, lowercaseKey) => {
		if (!record) return undefined
		if (record[camelCaseKey] !== undefined) return record[camelCaseKey]
		return record[lowercaseKey]
	}
	const normalizeDisplayValue = value => {
		const normalizedValue = String(value === undefined || value === null ? '' : value)
			.trim()
			.replace(/\s+/g, ' ')
		return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1)
	}
	const buildCode = value => normalizeDisplayValue(value)
		.toLowerCase()
		.replace(/\s+/g, '')
	const normalizeRecord = record => ({
		id: fieldValue(record, 'id', 'id'),
		codeType: fieldValue(record, 'codeType', 'codetype'),
		code: fieldValue(record, 'code', 'code'),
		description: fieldValue(record, 'description', 'description'),
		displayValue: fieldValue(record, 'displayValue', 'displayvalue'),
		isVisible: fieldValue(record, 'isVisible', 'isvisible'),
		isModifiable: fieldValue(record, 'isModifiable', 'ismodifiable'),
		isDeletable: fieldValue(record, 'isDeletable', 'isdeletable'),
		uiDisplayOrder: fieldValue(record, 'uiDisplayOrder', 'uidisplayorder')
	})

	return {
		codeMaxLength: 40,
		displayValueMaxLength: 100,
		optionTypes,
		medicationTypes,
		normalizeDisplayValue,
		buildCode,
		normalizeRecord
	}
})
