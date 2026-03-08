from django.core.management.base import BaseCommand
from django.apps import apps


class Command(BaseCommand):
    help = 'Copy data from orders.Order into appointments.Appointment (one-time data migration)'

    def handle(self, *args, **options):
        Order = apps.get_model('orders', 'Order')
        Appointment = apps.get_model('appointments', 'Appointment')

        qs = Order.objects.all()
        self.stdout.write(f'Found {qs.count()} orders to copy')

        created = 0
        for o in qs:
            # Avoid duplicate by order_number
            if Appointment.objects.filter(order_number=o.order_number).exists():
                continue
            Appointment.objects.create(
                order_number=o.order_number,
                patient=o.buyer,
                status=o.status,
                total_amount=getattr(o, 'total_amount', 0) or 0,
                created_at=o.created_at,
                updated_at=getattr(o, 'updated_at', None),
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created} Appointment rows'))
