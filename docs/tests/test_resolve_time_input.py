"""Template contracts for the native PowerSchool drawer time widget.

PowerSchool's legacy drawer setup misses late-created timeEntry inputs,
leaving a 200px field with 3px padding instead of the native 86px field with
20px clock padding. The Angular time directive initializes it explicitly;
ng-show keeps the initialized control across resolution changes.
These checks guard the lifecycle markup; native widget behavior needs a browser.
"""
from html.parser import HTMLParser
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]


class Elements(HTMLParser):
    def __init__(self, filename):
        super().__init__()
        self.elements = []
        self.feed((ROOT / "web_root/admin/students/medication" / filename).read_text())

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

    def by_id(self, element_id):
        return next(attrs for _, attrs in self.elements if attrs.get("id") == element_id)

    def time_input(self):
        return next(attrs for tag, attrs in self.elements
                    if tag == "input" and "timeEntry" in attrs.get("class", "").split())


class ResolveTimeInputTest(unittest.TestCase):
    def setUp(self):
        self.resolve = Elements("resolveExpectedAdministration.html")

    def test_given_row_keeps_time_widget_mounted_across_resolution_changes(self):
        row = self.resolve.by_id("expected-administration-given")
        self.assertEqual(row.get("ng-show"), "expectedAdmin.record.resolution_type === 'given'")
        self.assertNotIn("ng-if", row)

    def test_time_input_uses_same_native_widget_as_administer_drawer(self):
        reference = Elements("administerMedication.html").time_input()
        actual = self.resolve.time_input()
        for attribute in ("type", "class", "size"):
            self.assertEqual(actual[attribute], reference[attribute])
        self.assertIn("pss-time-widget", actual)
        self.assertNotIn("data-auto-translate", actual)
        self.assertNotIn("style", actual)
        # Let PowerSchool add its own wrapper and initialization classes.
        self.assertNotIn("hasTimeEntry", actual["class"])
        self.assertNotIn("drawer-input", actual["class"])

    def test_hidden_time_input_does_not_block_not_given_validation(self):
        actual = self.resolve.time_input()
        self.assertEqual(actual["ng-model"], "expectedAdmin.record.event_time")
        self.assertEqual(actual["ng-change"], "expectedAdmin.checkReqFields()")
        self.assertNotIn("required", actual)
        self.assertNotIn("ng-required", actual)
        self.assertNotIn("disabled", actual)


if __name__ == "__main__":
    unittest.main()
