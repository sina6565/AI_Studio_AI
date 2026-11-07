import unittest

from server import validate_payload


def payload(function=True, form=False, paid=False):
    gates = {
        "functionApproved": function,
        "functionApproval": {"approvedBy": "owner", "approvedAt": "2026-11-06T00:00:00+00:00", "evidence": ["studio:function"]} if function else {},
        "formApproved": form,
        "formApproval": {"approvedBy": "owner", "approvedAt": "2026-11-06T00:01:00+00:00", "evidence": ["preview.png"]} if form else {},
    }
    return {
        "engine": {"id": "unreal_engine_5", "majorVersion": 5},
        "manifest": {
            "project": {"title": "SINA test"},
            "pipeline": {"paidServicesAllowed": paid, "gates": gates},
            "room": {"id": "room-test"},
        },
    }


class WorkerGateTests(unittest.TestCase):
    def test_function_approval_is_enough_for_preview(self):
        manifest = validate_payload(payload(function=True, form=False), require_form=False)
        self.assertEqual(manifest["room"]["id"], "room-test")

    def test_final_build_requires_form_approval(self):
        with self.assertRaisesRegex(ValueError, "Form approval"):
            validate_payload(payload(function=True, form=False), require_form=True)

    def test_final_build_accepts_both_approvals(self):
        manifest = validate_payload(payload(function=True, form=True), require_form=True)
        self.assertTrue(manifest["pipeline"]["gates"]["formApproved"])

    def test_paid_services_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "Paid services"):
            validate_payload(payload(function=True, form=False, paid=True), require_form=False)

    def test_function_evidence_is_required(self):
        request = payload(function=True, form=False)
        request["manifest"]["pipeline"]["gates"]["functionApproval"]["evidence"] = []
        with self.assertRaisesRegex(ValueError, "Function approval evidence"):
            validate_payload(request, require_form=False)


if __name__ == "__main__":
    unittest.main()
