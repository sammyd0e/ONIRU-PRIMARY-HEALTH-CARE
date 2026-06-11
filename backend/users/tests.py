from django.db import connection
from django.test import TestCase

from appointments.models import Appointment
from users.admin import repair_user_related_integrity
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

    def test_appointment_repair_with_missing_doctor(self):
        appointment = Appointment.objects.create(
            order_number='TEST-1002',
            patient=User.objects.create(email='patient-doctor@example.com', first_name='Patient', last_name='Doctor', is_active=True),
            doctor_id=999999,
            status='pending',
            clinic_id='CLINIC2',
        )

        self.assertTrue(appointment.doctor_id)
        self.assertTrue(User.objects.filter(pk=appointment.doctor_id).exists())

    def test_appointment_repair_with_missing_child_account(self):
        appointment = Appointment.objects.create(
            order_number='TEST-1003',
            patient=User.objects.create(email='patient-child@example.com', first_name='Patient', last_name='Child', is_active=True),
            child_account_id=999999,
            status='pending',
            clinic_id='CLINIC3',
        )

        self.assertIsNone(appointment.child_account_id)

    def test_repair_user_related_integrity_removes_invalid_group_assignments(self):
        user = User.objects.create(email='admin-repair@example.com', first_name='Admin', last_name='Repair', is_active=True)

        through_table = user.groups.through._meta.db_table
        with connection.cursor() as cursor:
            cursor.execute(f'INSERT INTO {through_table} (user_id, group_id) VALUES (%s, %s)', [user.pk, 999999])

        repair_user_related_integrity(user)

        self.assertFalse(user.groups.through.objects.filter(user_id=user.pk, group_id=999999).exists())
