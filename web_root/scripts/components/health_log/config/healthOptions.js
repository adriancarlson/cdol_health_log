'use strict'
define(() => {
	const optionTypes = [
		{ codeType: 'MED_DOSE_UNIT', displayName: 'Medication Dose Units', section: 'Medication', medicationField: 'dose_unit' },
		{ codeType: 'MED_INVENTORY_UNIT', displayName: 'Medication Inventory Units', section: 'Medication', medicationField: 'inventory_unit' },
		{ codeType: 'MED_ROUTE', displayName: 'Medication Routes', section: 'Medication', medicationField: 'route' },
		{ codeType: 'MED_FREQUENCY', displayName: 'Medication Frequencies', section: 'Medication', medicationField: 'frequency' },
		{ codeType: 'MED_REMOVAL_TYPE', displayName: 'Medication Removal Types', section: 'Medication', medicationField: 'removal_type' },
		{ codeType: 'MED_NOT_GIVEN_REASON', displayName: 'Medication Not-Given Reasons', section: 'Medication', medicationField: 'not_given_reason' },
		{ codeType: 'HEALTH_COMPLAINT', displayName: 'Health Log Complaints', section: 'Health Log' },
		{ codeType: 'HEALTH_DESTINATION', displayName: 'Health Log Destinations', section: 'Health Log' },
		{ codeType: 'HEALTH_CONVERSATION', displayName: 'Health Log Communication Methods', section: 'Health Log' }
	]
	const medicationTypes = optionTypes.reduce((types, optionType) => {
		if (!optionType.medicationField) return types
		types[optionType.medicationField] = {
			codeType: optionType.codeType,
			modelValueField: 'code'
		}
		return types
	}, {})
	const healthLogTypes = {
		complaint: { codeType: 'HEALTH_COMPLAINT' },
		destination: { codeType: 'HEALTH_DESTINATION' },
		conversation_type: { codeType: 'HEALTH_CONVERSATION' }
	}
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
	const normalizeIdentity = value => normalizeDisplayValue(value).toLowerCase()
	const similarityNoiseWords = [
		'a', 'an', 'at', 'back', 'for', 'go', 'going', 'in', 'of', 'on',
		'return', 'returned', 'returning', 'send', 'sent', 'the', 'to', 'went'
	]
	const normalizeSimilarityIdentity = value => {
		const normalizedValue = normalizeIdentity(value)
			.replace(/&/g, ' and ')
			.replace(/[^a-z0-9\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
		if (!normalizedValue) return ''
		const meaningfulWords = normalizedValue.split(' ').filter(word => similarityNoiseWords.indexOf(word) === -1)
		return (meaningfulWords.length ? meaningfulWords : normalizedValue.split(' ')).join(' ')
	}
	const findSimilarOption = (value, options) => {
		const similarityIdentity = normalizeSimilarityIdentity(value)
		if (!similarityIdentity) return null
		return (options || []).find(option =>
			normalizeSimilarityIdentity(option && option.displayValue) === similarityIdentity
		) || null
	}
	const buildCode = value => normalizeDisplayValue(value)
		.toLowerCase()
		.replace(/\s+/g, '')
	const buildCodeForType = (codeType, value) => {
		const code = buildCode(value)
		return codeType === 'HEALTH_CONVERSATION' ? code.replace(/,/g, '') : code
	}
	const normalizeRecord = record => ({
		id: fieldValue(record, 'id', 'id'),
		codeType: fieldValue(record, 'codeType', 'codetype'),
		code: fieldValue(record, 'code', 'code'),
		description: fieldValue(record, 'description', 'description'),
		displayValue: fieldValue(record, 'displayValue', 'displayvalue'),
		isVisible: fieldValue(record, 'isVisible', 'isvisible'),
		uiDisplayOrder: fieldValue(record, 'uiDisplayOrder', 'uidisplayorder'),
		whoCreated: fieldValue(record, 'whoCreated', 'whocreated'),
		whenCreated: fieldValue(record, 'whenCreated', 'whencreated'),
		whoModified: fieldValue(record, 'whoModified', 'whomodified'),
		whenModified: fieldValue(record, 'whenModified', 'whenmodified')
	})

	return {
		codeMaxLength: 40,
		displayValueMaxLength: 100,
		optionTypes,
		medicationTypes,
		healthLogTypes,
		normalizeDisplayValue,
		normalizeSimilarityIdentity,
		findSimilarOption,
		buildCode,
		buildCodeForType,
		normalizeRecord
	}
})
