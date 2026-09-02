/* School-level missed medication count. No student or medication details leave the count endpoint. */
(function (window, document, $j) {
    'use strict'

    const previous = window.CDOLMissedMedicationCount
    // Both footer hooks can render in one document. Fetch only once for that page.
    if (previous && previous.isActive && previous.isActive()) return
    if (previous && previous.stop) previous.stop()

    const itemId = 'cdolMissedMedicationCountItem'
    let active = true
    let request = null

    const removeIcon = () => {
        document.querySelectorAll(`[id="${itemId}"]`).forEach(item => item.remove())
    }

    // PowerSchool JSON pages can return an object, an array, or HTML-encoded JSON text.
    const readCount = response => {
        let value = response
        if (typeof value === 'string') {
            if (window.psUtils && window.psUtils.htmlEntitiesToCharCode) {
                value = window.psUtils.htmlEntitiesToCharCode(value)
            }
            value = JSON.parse(value.trim())
        }
        if (Array.isArray(value)) value = value[0]
        if (!value || value.authorized === false || value.student_count === null ||
            value.student_count === undefined || String(value.student_count).trim() === '') {
            throw new Error('Missed medication count unavailable')
        }
        const count = Number(value.student_count)
        if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid missed medication count')
        return count
    }

    const render = count => {
        const toolbar = document.getElementById('tools2')
        if (!toolbar || count === 0) {
            removeIcon()
            return
        }

        let item = document.getElementById(itemId)
        if (!item) {
            item = document.createElement('li')
            item.id = itemId
            item.className = 'pds-app-action cdol-toolbar-count-item'

            const display = document.createElement('a')
            display.className = 'cdol-toolbar-count-display cdol-toolbar-count-link'
            display.href = '/admin/reports_pscb_dev_pro/health/cdol_missed_daily_administration.html'

            const icon = document.createElement('img')
            icon.src = '/images/cdol_health_log/icon-missed-medication-white.svg'
            icon.alt = ''
            icon.width = 15
            icon.height = 20
            icon.className = 'cdol-toolbar-count-icon'
            icon.setAttribute('aria-hidden', 'true')

            const badge = document.createElement('span')
            badge.className = 'cdol-toolbar-count-badge'
            badge.setAttribute('aria-hidden', 'true')
            display.append(icon, badge)
            item.append(display)

            // Follow the enrollment shortcut: insert before the final toolbar action (Help).
            const actions = Array.from(toolbar.children).filter(child => child.classList.contains('pds-app-action'))
            toolbar.insertBefore(item, actions.length ? actions[actions.length - 1] : null)
        }

        const label = `${count} ${count === 1 ? 'student has' : 'students have'} missed daily medication administrations`
        const display = item.querySelector('.cdol-toolbar-count-display')
        display.title = label
        display.setAttribute('aria-label', label)
        item.querySelector('.cdol-toolbar-count-badge').textContent = String(count)
    }

    const loadCount = () => {
        if (!active || !document.getElementById('tools2')) return
        request = $j.ajax({
            url: '/admin/medication/data/missedMedicationCount.json',
            method: 'GET',
            dataType: 'text',
            cache: false,
            timeout: 20000
        })
        request.done(response => {
            if (!active) return
            try {
                render(readCount(response))
            } catch (error) {
                removeIcon()
            }
        }).fail(() => {
            if (active) removeIcon()
        }).always(() => {
            request = null
        })
    }

    const stop = () => {
        active = false
        if (request) request.abort()
        removeIcon()
    }

    window.CDOLMissedMedicationCount = { stop, isActive: () => active }
    $j(() => {
        if (!active) return
        removeIcon()
        // Match Enrollment Express: calculate at page load, with no polling or focus refresh.
        loadCount()
    })
})(window, document, $j)
