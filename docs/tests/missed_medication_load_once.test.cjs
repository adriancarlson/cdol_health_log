const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const source = fs.readFileSync(path.resolve(__dirname, '../../web_root/scripts/cdol_health_log/missedMedicationCount.js'), 'utf8')

function page({ hidden = false, toolbar = true } = {}) {
    const ready = [], requests = []
    const prohibited = () => { throw new Error('Background timer or event listener registered') }
    const window = { setTimeout: prohibited, setInterval: prohibited, addEventListener: prohibited }
    const document = {
        hidden, addEventListener: prohibited,
        getElementById: id => toolbar && id === 'tools2' ? {} : null,
        querySelectorAll: () => []
    }
    const $j = callback => ready.push(callback)
    $j.ajax = options => {
        const callbacks = {}
        const request = {
            options,
            done: fn => { callbacks.done = fn; return request },
            fail: fn => { callbacks.fail = fn; return request },
            always: fn => { callbacks.always = fn; return request },
            resolve: value => { callbacks.done(value); callbacks.always() },
            reject: () => { callbacks.fail(); callbacks.always() },
            abort: () => { request.aborted = true; request.reject() }
        }
        requests.push(request)
        return request
    }
    const context = vm.createContext({ window, document, $j })
    const loadScript = () => vm.runInContext(source, context)
    const pageReady = () => { while (ready.length) ready.shift()() }
    loadScript()
    return { window, document, requests, loadScript, pageReady }
}

test('one GET at document ready, without refresh timers or event handlers', () => {
    const fixture = page()
    assert.equal(fixture.requests.length, 0)
    fixture.pageReady()
    assert.equal(fixture.requests.length, 1)
    assert.equal(fixture.requests[0].options.method, 'GET')
    assert.equal(fixture.requests[0].options.url, '/admin/medication/data/missedMedicationCount.json')
    assert.equal(fixture.requests[0].options.data, undefined)
    fixture.requests[0].resolve('{"student_count":0}')
    assert.equal(fixture.requests.length, 1)
    assert.equal(fixture.window.CDOLMissedMedicationCount.refresh, undefined)
})

test('a background-tab page load still fetches once', () => {
    const fixture = page({ hidden: true })
    fixture.pageReady()
    assert.equal(fixture.requests.length, 1)
})

test('duplicate footer before and after ready never duplicates requests', () => {
    const fixture = page()
    fixture.loadScript()
    fixture.pageReady()
    fixture.loadScript()
    fixture.pageReady()
    fixture.requests[0].resolve('{"student_count":0}')
    fixture.loadScript()
    fixture.pageReady()
    assert.equal(fixture.requests.length, 1)
})

test('network failure does not start polling or retry on a repeated footer', () => {
    const fixture = page()
    fixture.pageReady()
    fixture.requests[0].reject()
    fixture.loadScript()
    fixture.pageReady()
    assert.equal(fixture.requests.length, 1)
})

test('denied or malformed responses do not schedule retries', () => {
    for (const response of ['{"authorized":false}', '<html>Login</html>']) {
        const fixture = page()
        fixture.pageReady()
        fixture.requests[0].resolve(response)
        assert.equal(fixture.requests.length, 1)
    }
})

test('pages without a toolbar do not request a count', () => {
    const fixture = page({ toolbar: false })
    fixture.pageReady()
    assert.equal(fixture.requests.length, 0)
})

test('stop cancels an in-flight instance and permits an explicit new initialization', () => {
    const fixture = page()
    fixture.pageReady()
    fixture.window.CDOLMissedMedicationCount.stop()
    assert.equal(fixture.requests[0].aborted, true)
    fixture.loadScript()
    fixture.pageReady()
    assert.equal(fixture.requests.length, 2)
})

test('navigating to a new document fetches a fresh count', () => {
    const first = page(), second = page()
    first.pageReady()
    second.pageReady()
    assert.equal(first.requests.length, 1)
    assert.equal(second.requests.length, 1)
})
