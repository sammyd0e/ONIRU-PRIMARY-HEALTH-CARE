from django.core.management.base import BaseCommand
from django.db.models import Q
from users.models import PatientProfile, ChildAccount, Appointment


class Command(BaseCommand):
    help = 'Check and report on PatientProfile data integrity issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Attempt to fix identified issues (use with caution)',
        )

    def handle(self, *args, **options):
        fix_issues = options.get('fix', False)
        
        self.stdout.write(self.style.SUCCESS('\n=== PatientProfile Integrity Check ===\n'))
        
        # Check 1: PatientProfiles with NULL user
        null_user_profiles = PatientProfile.objects.filter(user__isnull=True)
        self.stdout.write(f"PatientProfiles with NULL user: {null_user_profiles.count()}")
        for profile in null_user_profiles:
            self.stdout.write(f"  - ID: {profile.id}, clinic_id: {profile.clinic_id}")
            
            # Check if it has a related ChildAccount
            has_child = ChildAccount.objects.filter(child_profile_id=profile.id).exists()
            if has_child:
                self.stdout.write(self.style.WARNING(f"    WARNING: Has related ChildAccount!"))
        
        # Check 2: ChildAccounts referencing PatientProfiles with NULL user
        bad_child_accounts = ChildAccount.objects.filter(
            child_profile__user__isnull=True
        )
        self.stdout.write(f"\nChildAccounts with NULL user in child_profile: {bad_child_accounts.count()}")
        for ca in bad_child_accounts:
            self.stdout.write(f"  - ChildAccount ID: {ca.id}, Parent: {ca.parent.email}, Child Profile: {ca.child_profile.id}")
        
        # Check 3: Appointments referencing profiles
        null_user_appointments = Appointment.objects.filter(patient__patient_profile__user__isnull=True)
        self.stdout.write(f"\nAppointments with NULL user in patient profile: {null_user_appointments.count()}")
        for apt in null_user_appointments[:10]:  # Show first 10
            self.stdout.write(f"  - Appointment ID: {apt.id}, clinic_id: {apt.clinic_id}")
        
        if fix_issues:
            self.stdout.write(self.style.WARNING('\n=== Attempting Fixes ===\n'))
            
            # For now, just report - don't auto-fix without user confirmation
            self.stdout.write(self.style.ERROR(
                'Auto-fix is not yet implemented. Please manually address these issues or contact support.'
            ))
        
        self.stdout.write(self.style.SUCCESS('\n=== Check Complete ===\n'))
