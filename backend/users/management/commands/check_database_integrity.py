from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from users.models import PatientProfile, ChildAccount, SellerProfile, Address
from appointments.models import Appointment, Diagnosis, TestResult, HealthRecord


class Command(BaseCommand):
    help = 'Inspect the database for broken foreign-key relationships and stale auth assignments.'

    def add_arguments(self, parser):
        parser.add_argument('--fix', action='store_true', help='Attempt to repair the issues that are found.')

    def handle(self, *args, **options):
        User = get_user_model()
        issues = []

        def add_issue(model_name, pk, detail):
            issues.append((model_name, pk, detail))

        for profile in PatientProfile.objects.all().select_related('user'):
            if profile.user_id is None:
                add_issue('PatientProfile', profile.pk, 'user_id is null')
            elif not User.objects.filter(pk=profile.user_id).exists():
                add_issue('PatientProfile', profile.pk, f'user_id={profile.user_id} does not exist')

        for account in ChildAccount.objects.all().select_related('parent', 'child_profile'):
            if account.parent_id is None:
                add_issue('ChildAccount', account.pk, 'parent_id is null')
            elif not User.objects.filter(pk=account.parent_id).exists():
                add_issue('ChildAccount', account.pk, f'parent_id={account.parent_id} does not exist')

            if account.child_profile_id is None:
                add_issue('ChildAccount', account.pk, 'child_profile_id is null')
            elif not PatientProfile.objects.filter(pk=account.child_profile_id).exists():
                add_issue('ChildAccount', account.pk, f'child_profile_id={account.child_profile_id} does not exist')

        for profile in SellerProfile.objects.all().select_related('user'):
            if profile.user_id is None:
                add_issue('SellerProfile', profile.pk, 'user_id is null')
            elif not User.objects.filter(pk=profile.user_id).exists():
                add_issue('SellerProfile', profile.pk, f'user_id={profile.user_id} does not exist')

        for address in Address.objects.all().select_related('user'):
            if address.user_id is None:
                add_issue('Address', address.pk, 'user_id is null')
            elif not User.objects.filter(pk=address.user_id).exists():
                add_issue('Address', address.pk, f'user_id={address.user_id} does not exist')

        for appointment in Appointment.objects.all().select_related('patient', 'doctor', 'child_account'):
            if appointment.patient_id is None:
                add_issue('Appointment', appointment.pk, 'patient_id is null')
            elif not User.objects.filter(pk=appointment.patient_id).exists():
                add_issue('Appointment', appointment.pk, f'patient_id={appointment.patient_id} does not exist')

            if appointment.doctor_id is not None and not User.objects.filter(pk=appointment.doctor_id).exists():
                add_issue('Appointment', appointment.pk, f'doctor_id={appointment.doctor_id} does not exist')

            if appointment.child_account_id is not None and not ChildAccount.objects.filter(pk=appointment.child_account_id).exists():
                add_issue('Appointment', appointment.pk, f'child_account_id={appointment.child_account_id} does not exist')

        for record in Diagnosis.objects.all().select_related('user'):
            if record.user_id is None:
                add_issue('Diagnosis', record.pk, 'user_id is null')
            elif not User.objects.filter(pk=record.user_id).exists():
                add_issue('Diagnosis', record.pk, f'user_id={record.user_id} does not exist')

        for record in TestResult.objects.all().select_related('user'):
            if record.user_id is None:
                add_issue('TestResult', record.pk, 'user_id is null')
            elif not User.objects.filter(pk=record.user_id).exists():
                add_issue('TestResult', record.pk, f'user_id={record.user_id} does not exist')

        for record in HealthRecord.objects.all().select_related('user'):
            if record.user_id is None:
                add_issue('HealthRecord', record.pk, 'user_id is null')
            elif not User.objects.filter(pk=record.user_id).exists():
                add_issue('HealthRecord', record.pk, f'user_id={record.user_id} does not exist')

        for user in User.objects.all():
            group_through = user.groups.through
            for relation in group_through.objects.filter(user_id=user.pk):
                if not Group.objects.filter(pk=relation.group_id).exists():
                    add_issue('UserGroup', relation.pk, f'user_id={user.pk} group_id={relation.group_id} does not exist')

            permission_through = user.user_permissions.through
            for relation in permission_through.objects.filter(user_id=user.pk):
                if not Permission.objects.filter(pk=relation.permission_id).exists():
                    add_issue('UserPermission', relation.pk, f'user_id={user.pk} permission_id={relation.permission_id} does not exist')

        self.stdout.write(self.style.SUCCESS(f'Found {len(issues)} integrity issue(s).'))
        for model_name, pk, detail in issues:
            self.stdout.write(f'{model_name}#{pk}: {detail}')

        if options.get('fix'):
            self.stdout.write(self.style.WARNING('Repair mode is not enabled in this pass.'))
