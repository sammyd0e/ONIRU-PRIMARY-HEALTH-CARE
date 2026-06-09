from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from users.models import PatientProfile


class Command(BaseCommand):
    help = 'Find and optionally repair PatientProfile rows whose user relation is broken or missing.'

    def add_arguments(self, parser):
        parser.add_argument('--repair', action='store_true', help='Create placeholder users and re-link orphaned PatientProfile rows.')
        parser.add_argument('--dry-run', action='store_true', help='Only report broken rows without changing anything.')

    def handle(self, *args, **options):
        User = get_user_model()
        repair = options['repair'] or options['dry_run'] is False and False
        dry_run = options['dry_run'] or not options['repair']

        broken = []
        for profile in PatientProfile.objects.all().select_related('user'):
            if profile.user_id is None:
                broken.append((profile.id, 'missing_user', None))
                continue
            if not User.objects.filter(pk=profile.user_id).exists():
                broken.append((profile.id, 'invalid_user', profile.user_id))

        if not broken:
            self.stdout.write(self.style.SUCCESS('No broken PatientProfile rows found.'))
            return

        self.stdout.write(self.style.WARNING(f'Found {len(broken)} broken PatientProfile row(s):'))
        for item in broken:
            profile_id, reason, user_id = item
            self.stdout.write(f' - profile_id={profile_id} reason={reason} user_id={user_id}')

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run only. No changes were made.'))
            return

        for profile_id, reason, user_id in broken:
            profile = PatientProfile.objects.get(pk=profile_id)
            if profile.user_id is not None and User.objects.filter(pk=profile.user_id).exists():
                continue

            email = f'patient-{profile.id}@placeholder.invalid'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': profile.first_name or 'Patient',
                    'last_name': profile.last_name or str(profile.id),
                    'is_active': True,
                },
            )
            if created:
                user.set_password('TempPassword123!')
                user.save()

            profile.user = user
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Repaired profile_id={profile.id} -> user_id={user.id} email={user.email}'))
