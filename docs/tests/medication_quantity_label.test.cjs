const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')

const medicationDir = path.resolve(__dirname, '../../web_root/admin/students/medication')
const filters = {}
// Register the actual Angular module without instantiating controllers or making requests.
vm.runInNewContext(fs.readFileSync(path.join(medicationDir, 'medication.js'), 'utf8'), {
    define: (_dependencies, factory) => factory({ module: () => ({
        controller: () => {},
        filter: (name, factory) => { filters[name] = factory() }
    }) }, {})
})
const pluralize = filters.pluralize

test('quantities of one or less display Pill for singular or plural option labels', () => {
    for (const quantity of [0, 0.25, 0.5, 0.75, 1, '0', '0.25', '0.5', '1', '1.0', '1.00']) {
        assert.equal(pluralize('Pill', quantity), 'Pill')
        assert.equal(pluralize('Pills', quantity), 'Pill')
    }
})

test('quantities greater than one retain plural labels', () => {
    for (const quantity of [1.01, 1.5, 2, '1.01', '1.5', '2']) {
        assert.equal(pluralize('Pill', quantity), 'Pills')
        assert.equal(pluralize('Pills', quantity), 'Pills')
    }
})

test('all default inventory units support singular quantity without losing prefixes', () => {
    for (const [plural, singular] of [
        ['Tablets', 'Tablet'], ['Capsules', 'Capsule'], ['Units', 'Unit'],
        ['(ML) Milliliters', '(ML) Milliliter'], ['(MG) Milligrams', '(MG) Milligram'],
        ['PILLS', 'PILL'], ['pills', 'pill']
    ]) {
        for (const quantity of [0.25, 0.5, 1]) assert.equal(pluralize(plural, quantity), singular)
    }
})

test('singular custom labels, abbreviations, and empty values remain intact', () => {
    for (const label of ['mL', 'mg', 'Each', 'Glass', 'Custom label', '', null, undefined]) {
        assert.equal(pluralize(label, 1), label)
    }
})

test('callers without a quantity retain the previous plural behavior', () => {
    assert.equal(pluralize('Pill'), 'Pills')
    assert.equal(pluralize('Pills'), 'Pills')
    assert.equal(pluralize('(ML) Milliliters'), '(ML) Milliliters')
    assert.equal(pluralize('Tablet'), 'Tablets')
    for (const quantity of [undefined, null, '', ' ', NaN, 'invalid', Infinity]) {
        assert.equal(pluralize('Pill', quantity), 'Pills')
    }
})

test('history template supplies the effective quantity and retains non-given dashes', () => {
    const template = fs.readFileSync(path.join(medicationDir, 'administration.html'), 'utf8')
    assert.match(template, /pluralize:administration\.quantity_administered/)
    assert.match(template, /ng-if="!administration\.is_given">&mdash;/)
})
