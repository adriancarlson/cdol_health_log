const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const medicationDir = path.resolve(__dirname, '../../web_root/admin/students/medication')
const source = fs.readFileSync(path.join(medicationDir, 'medication.js'), 'utf8')
const settingsDir = path.resolve(__dirname, '../../web_root/admin/schoolsetup/medication')
const start = source.indexOf('const roundedInventoryQuantity =')
const end = source.indexOf('\n\tconst normalizeDateKey =', start)
if (start < 0 || end < 0) throw new Error('Inventory display helper source boundary changed')
const getInventoryBatchDisplay = vm.runInNewContext(
    source.slice(start, end) + '\ngetInventoryBatchDisplay'
)

const batches = [
    { effective_quantity_added: 12, inventory_entry_correction_quantity: 0, quantity_remaining: 0 },
    { effective_quantity_added: 19, inventory_entry_correction_quantity: 0, quantity_remaining: 13 }
]

test('keeps depleted batches and the complete denominator when the setting is disabled', () => {
    const display = getInventoryBatchDisplay(batches, false)
    assert.equal(display.displayBatches.length, 2)
    assert.equal(display.displayTotalRemaining, 13)
    assert.equal(display.displayTotalEffective, 31)
})

test('hides depleted batches and removes their original quantities from the displayed total', () => {
    const display = getInventoryBatchDisplay(batches, true)
    assert.equal(display.displayBatches.length, 1)
    assert.equal(display.displayTotalRemaining, 13)
    assert.equal(display.displayTotalEffective, 19)
})

test('continues hiding fully corrected batches regardless of the setting', () => {
    const corrected = [{
        effective_quantity_added: 0,
        inventory_entry_correction_quantity: 12,
        quantity_remaining: 0
    }]
    assert.equal(getInventoryBatchDisplay(corrected, false).displayBatches.length, 0)
    assert.equal(getInventoryBatchDisplay(corrected, true).displayBatches.length, 0)
})

test('settings page persists an opt-in checkbox and the inventory page loads school settings', () => {
    const settingsHtml = fs.readFileSync(path.join(settingsDir, 'administration_settings.html'), 'utf8')
    const settingsSource = fs.readFileSync(path.join(settingsDir, 'administration_settings.js'), 'utf8')
    const schema = fs.readFileSync(path.resolve(__dirname, '../../user_schema_root/u_cdol_med_admin_setting.xml'), 'utf8')

    assert.match(settingsHtml, /Hide Depleted Inventory Batches/)
    assert.match(settingsHtml, /ng-model="settings\.hideDepletedInventory"/)
    assert.match(settingsSource, /vm\.hideDepletedInventory = false/)
    assert.match(settingsSource, /hide_depleted_inventory: vm\.hideDepletedInventory \? 1 : 0/)
    assert.match(source, /\['administration', 'inventory'\]\.includes\(\$rootScope\.appData\.context\)/)
    assert.match(schema, /<field name="hide_depleted_inventory" type="Integer"/)
})
