from django.contrib import admin
from .models import Appointment, Diagnosis, TestResult
from .models_arthnatal import ArthnatalBooking

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_patient_email', 'scheduled_date', 'scheduled_time', 'clinic_id')

    def get_patient_email(self, obj):
        return obj.patient.email if obj.patient else '-'
    get_patient_email.short_description = 'Patient Email'


# Register ArthnatalBooking for admin management
@admin.register(ArthnatalBooking)
class ArthnatalBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'phone', 'preferred_date', 'patient', 'created_at')
    search_fields = ('name', 'email', 'phone')
    list_filter = ('preferred_date', 'created_at')


# Register Diagnosis and TestResult for admin management
@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'label', 'date', 'created_at')
    search_fields = ('label', 'details', 'extra_info')
    list_filter = ('date', 'created_at', 'user')

@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'label', 'result', 'date', 'created_at')
    search_fields = ('label', 'result', 'details', 'extra_info')
    list_filter = ('date', 'created_at', 'user')
