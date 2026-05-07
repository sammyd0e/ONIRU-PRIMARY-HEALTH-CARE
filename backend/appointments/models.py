def get_today():
    from django.utils import timezone
    return timezone.now().date()

from django.db import models
from django.conf import settings
from django.utils import timezone

# Model for patients attended by frontdesk staff
class AttendedPatient(models.Model):
    name = models.CharField(max_length=255)
    clinic_id = models.CharField(max_length=32)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    sex = models.CharField(max_length=16)
    payment_method = models.CharField(max_length=32, blank=True, null=True)
    appointment_type = models.CharField(max_length=32, blank=True, null=True, help_text="Type of appointment, e.g. General, Antenatal, Eyes")
    payment_type = models.CharField(max_length=32, blank=True, null=True, help_text="Type of payment, e.g. full, partial, insurance")
    attended_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointments_attendedpatient'
        ordering = ['-attended_at']

    def __str__(self):
        return f"{self.name} ({self.clinic_id}) - {self.amount_paid} - {self.sex}"

class Diagnosis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='diagnoses')
    label = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    extra_info = models.TextField(blank=True, help_text="Extra information for frontend display")
    date = models.DateField(default=get_today)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointments_diagnosis'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Diagnosis: {self.label} ({self.date})"


class TestResult(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_results')
    label = models.CharField(max_length=255)
    result = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    extra_info = models.TextField(blank=True, help_text="Extra information for frontend display")
    date = models.DateField(default=get_today)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointments_testresult'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"TestResult: {self.label} - {self.result} ({self.date})"


class HealthRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='health_records')
    label = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointments_healthrecord'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"HealthRecord: {self.label} ({self.date})"
from django.db import models
from django.conf import settings
from django.utils import timezone

from .models_arthnatal import ArthnatalBooking


class Appointment(models.Model):
    """Schema for new appointments app. This intentionally uses a new
    DB table name to avoid colliding with the existing orders tables.

    We'll copy data from orders.Order into this model using the
    management command `copy_orders_to_appointments`.
    """


    order_number = models.CharField(max_length=128, unique=True)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    # New: link to child account if appointment is for a child
    child_account = models.ForeignKey('users.ChildAccount', on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments_as_child')
    status = models.CharField(max_length=64, db_index=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    clinic_id = models.CharField(max_length=12, blank=True, null=True, db_index=True)
    appointment_type = models.CharField(max_length=32, blank=True, null=True, db_index=True, help_text="Type of appointment, e.g. General, Antenatal, Eyes")
    payment_method = models.CharField(max_length=16, blank=True, null=True, db_index=True, help_text="Payment method: cash or transfer")
    scheduled_date = models.DateField(null=True, blank=True, db_index=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    doctor = models.ForeignKey(
        'users.User', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='appointments_as_doctor'
    )
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(default=timezone.now, null=False)

    class Meta:
        db_table = 'appointments_appointment'

    def __str__(self):
        return f"Appointment {self.order_number} for {self.patient_id}"


class Doctor(models.Model):
    """Lightweight doctor registry used to list/select doctors in the booking UI.

    In a real system doctors would be users with profiles and availability rules.
    For now this model links to the User model and stores a clinic_id so we can
    quickly filter doctors by clinic.
    """
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='doctor_profile')
    display_name = models.CharField(max_length=255)
    clinic_id = models.CharField(max_length=12, blank=True, null=True, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'appointments_doctor'

    def __str__(self):
        return f"Doctor: {self.display_name} ({self.clinic_id})"


# The following settings and frontend constant were accidentally placed in
# models.py; they should be moved into your Django settings module and
# your frontend code respectively to avoid syntax/runtime errors.
#
# Example (move to settings.py):
# INSTALLED_APPS += ['corsheaders']
# MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + MIDDLEWARE
# CORS_ALLOW_ALL_ORIGINS = True  # For development only!
#
# Example (keep in your React code):
# const API_BASE = process.env.REACT_APP_API_BASE || '';
#
# Removed from models.py to keep this module a pure Django models file.
