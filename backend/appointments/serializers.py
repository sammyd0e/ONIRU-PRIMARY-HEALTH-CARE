
from rest_framework import serializers
from .models import AttendedPatient

# Serializer for AttendedPatient
class AttendedPatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendedPatient
        fields = ['id', 'name', 'clinic_id', 'amount_paid', 'sex', 'payment_method', 'payment_type', 'appointment_type', 'attended_at']
from rest_framework import serializers
from .models import Appointment, Doctor, Diagnosis, TestResult

# Serializers for Diagnosis and TestResult
class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = ['id', 'label', 'details', 'extra_info', 'date', 'created_at']

class TestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestResult
        fields = ['id', 'label', 'result', 'details', 'extra_info', 'date', 'created_at']
from django.contrib.auth import get_user_model

User = get_user_model()

class DoctorSerializer(serializers.ModelSerializer):
    # expose the linked user id so frontends can pass the correct PK when
    # selecting a doctor (Appointment.doctor is a FK to the users table).
    user = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'display_name', 'is_active', 'user']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_full_name = serializers.SerializerMethodField()

    def get_patient_full_name(self, obj):
        if hasattr(obj.patient, 'first_name') and hasattr(obj.patient, 'last_name'):
            return f"{obj.patient.first_name} {obj.patient.last_name}".strip()
        return str(obj.patient)
    # allow passing doctor as a primary key
    doctor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)
    # Order number and status are generated server-side when the client omits them.
    # Mark them not required here so serializer validation won't fail when the
    # frontend omits these fields; perform_create will populate defaults.
    order_number = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)


    class Meta:
        model = Appointment
        fields = [
            'id', 'order_number', 'patient', 'patient_full_name', 'child_account', 'status', 'total_amount',
            'clinic_id', 'appointment_type', 'payment_method',
            'scheduled_date', 'scheduled_time', 'doctor', 'note', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'patient']

    def create(self, validated_data):
        request = self.context.get('request')
        # Remove any fields that shouldn't be passed to the serializer.
        for field in ['id', 'created_at', 'updated_at', 'patient']:
            validated_data.pop(field, None)

        doctor = validated_data.pop('doctor', None)
        child_account = validated_data.pop('child_account', None)
        # Set patient from request.user
        patient = None
        if request and hasattr(request, 'user'):
            patient = request.user
        if doctor is not None:
            appointment = Appointment(doctor=doctor, patient=patient, child_account=child_account, **validated_data)
        else:
            appointment = Appointment(patient=patient, child_account=child_account, **validated_data)
        appointment.save()
        return appointment
