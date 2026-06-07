from django.core.management.base import BaseCommand
from django.db import connection
from users.models import PatientProfile, ChildAccount


class Command(BaseCommand):
    help = 'Force cleanup of corrupted PatientProfile records with NULL user field'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of corrupted records',
        )

    def handle(self, *args, **options):
        confirm = options.get('confirm', False)
        
        self.stdout.write(self.style.WARNING('\n=== PatientProfile Corruption Cleanup ===\n'))
        
        # Find corrupted records
        null_profiles = PatientProfile.objects.filter(user__isnull=True)
        bad_children = ChildAccount.objects.filter(child_profile__user__isnull=True)
        
        if not null_profiles.exists() and not bad_children.exists():
            self.stdout.write(self.style.SUCCESS('✓ No corrupted records found!'))
            return
        
        self.stdout.write(f'Found {null_profiles.count()} PatientProfiles with NULL user')
        self.stdout.write(f'Found {bad_children.count()} ChildAccounts with NULL user profile\n')
        
        # Show what will be deleted
        if bad_children.exists():
            self.stdout.write(self.style.WARNING('ChildAccounts to be deleted:'))
            for ca in bad_children:
                self.stdout.write(f'  - ID: {ca.id}, Parent: {ca.parent.email}')
        
        if null_profiles.exists():
            self.stdout.write(self.style.WARNING('PatientProfiles to be deleted:'))
            for profile in null_profiles:
                self.stdout.write(f'  - ID: {profile.id}, clinic_id: {profile.clinic_id}')
        
        if not confirm:
            self.stdout.write(self.style.ERROR(
                '\n⚠️  DRY RUN - No changes made.\n'
                'Run with --confirm flag to actually delete records:\n'
                'python manage.py cleanup_corrupted_patient_profiles --confirm\n'
            ))
            return
        
        # Delete corrupted records
        try:
            bad_count = bad_children.count()
            if bad_count > 0:
                self.stdout.write(f'\nDeleting {bad_count} ChildAccounts...')
                bad_children.delete()
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {bad_count} ChildAccounts'))
            
            null_count = null_profiles.count()
            if null_count > 0:
                self.stdout.write(f'Deleting {null_count} PatientProfiles...')
                null_profiles.delete()
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {null_count} PatientProfiles'))
            
            self.stdout.write(self.style.SUCCESS('\n✓ Cleanup complete!\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error during cleanup: {e}\n'))
            raise
