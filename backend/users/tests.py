from django.test import TestCase

from appointments.models import Appointment
from users.models import ChildAccount, PatientProfile, User


class ModelIntegrityRegressionTests(TestCase):
    def test_patient_profile_repair_with_missing_user(self):
        profile = PatientProfile(user_id=999999, first_name='Auto', last_name='Repair')
        profile.save()

        self.assertTrue(profile.user_id)
        self.assertTrue(User.objects.filter(pk=profile.user_id).exists())

    def test_child_account_repair_with_missing_parent(self):
        profile = PatientProfile.objects.create(
            user=User.objects.create(email='child-profile@example.com', first_name='Child', last_name='Profile', is_active=True),
            first_name='Child',
            last_name='Profile',
        )

        account = ChildAccount(parent_id=999999, child_profile=profile)
        account.save()

        self.assertTrue(account.parent_id)
        self.assertTrue(User.objects.filter(pk=account.parent_id).exists())

    def test_appointment_repair_with_missing_patient(self):
        appointment = Appointment.objects.create(
            order_number='TEST-1001',
            patient_id=999999,
            status='pending',
            clinic_id='CLINIC1',
        )

        self.assertTrue(appointment.patient_id)
        self.assertTrue(User.objects.filter(pk=appointment.patient_id).exists())
