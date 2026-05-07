from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import DiagnosisSerializer, TestResultSerializer

# API view to fetch diagnoses and test results by clinic_id
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def diagnoses_and_results_by_clinic_id(request):
    clinic_id = request.query_params.get('clinic_id')
    if not clinic_id:
        return Response({'error': 'clinic_id is required'}, status=400)
    User = get_user_model()
    try:
        user = User.objects.get(patient_profile__clinic_id=clinic_id)
    except User.DoesNotExist:
        return Response({'error': 'No patient found for this clinic_id'}, status=404)
    diagnoses = user.diagnoses.all().order_by('-date', '-created_at')[:10]
    test_results = user.test_results.all().order_by('-date', '-created_at')[:10]
    combined = [
        {"type": "Diagnosis", **DiagnosisSerializer(d).data} for d in diagnoses
    ] + [
        {"type": "Test Result", **TestResultSerializer(t).data} for t in test_results
    ]
    combined.sort(key=lambda x: (x['date'], x['created_at']), reverse=True)
    return Response(combined)
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Count
from rest_framework import generics
from .models import AttendedPatient
from .serializers import AttendedPatientSerializer

class AttendedPatientCreateView(generics.CreateAPIView):
    queryset = AttendedPatient.objects.all()
    serializer_class = AttendedPatientSerializer
    # Optionally add authentication/permissions if needed

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def appointment_by_clinic_id(request):
    """
    Fetch the latest appointment for a given clinic_id.
    Returns: appointment_type, patient_full_name, total_amount, and other details.
    """
    clinic_id = request.query_params.get('clinic_id')
    print(f"DEBUG: appointment_by_clinic_id called with clinic_id={clinic_id}")
    if not clinic_id:
        print("DEBUG: clinic_id missing")
        return Response({'error': 'clinic_id is required'}, status=400)
    appt = Appointment.objects.filter(clinic_id=clinic_id).order_by('-created_at').first()
    print(f"DEBUG: found appointment={appt}")
    if not appt:
        print("DEBUG: No appointment found for clinic_id")
        return Response({'error': 'No appointment found for this clinic_id'}, status=404)
    # Use serializer to return details
    data = AppointmentSerializer(appt, context={'request': request}).data
    print(f"DEBUG: serialized data={data}")
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_patient_count_by_service(request):
    """
    Returns a count of patients per appointment_type for today.
    """
    today = timezone.now().date()
    qs = Appointment.objects.filter(scheduled_date=today)
    # Group by appointment_type and count
    data = (
        qs.values('appointment_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    # Return as {service: count}
    result = {item['appointment_type'] or 'Unknown': item['count'] for item in data}
    return Response(result)

# appointments/views.py
from rest_framework import viewsets, permissions
from .models import Appointment, Diagnosis, TestResult
from .serializers import AppointmentSerializer, DiagnosisSerializer, TestResultSerializer
from rest_framework import mixins

# ViewSet for Diagnosis

class DiagnosisViewSet(viewsets.ModelViewSet):
    queryset = Diagnosis.objects.all()
    serializer_class = DiagnosisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.email == "nurse@example.com":
            return Diagnosis.objects.all()
        # Patients see only their own diagnoses
        return Diagnosis.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and user.email == "nurse@example.com":
            # Expect patient_id in request.data
            patient_id = self.request.data.get('patient_id')
            if not patient_id:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"patient_id": "This field is required when nurse is creating a diagnosis."})
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                patient = User.objects.get(id=patient_id)
            except User.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"patient_id": "No user found with this id."})
            serializer.save(user=patient)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only nurse@example.com can create diagnoses.")


    def perform_update(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Authentication required to update diagnoses.")
        if user.email == "nurse@example.com":
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only nurse@example.com can update diagnoses.")


    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_authenticated:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Authentication required to delete diagnoses.")
        if user.email == "nurse@example.com":
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only nurse@example.com can delete diagnoses.")

# ViewSet for TestResult
class TestResultViewSet(viewsets.ModelViewSet):
    queryset = TestResult.objects.all()
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.email == "nurse@example.com":
            return TestResult.objects.all()
        # Patients see only their own test results
        return TestResult.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and user.email == "nurse@example.com":
            # Expect patient_id in request.data
            patient_id = self.request.data.get('patient_id')
            if not patient_id:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"patient_id": "This field is required when nurse is creating a test result."})
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                patient = User.objects.get(id=patient_id)
            except User.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"patient_id": "No user found with this id."})
            serializer.save(user=patient)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only nurse@example.com can create test results.")

    def perform_update(self, serializer):
        user = self.request.user
        if user.is_authenticated and user.email == "nurse@example.com":
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only nurse@example.com can update test results.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.is_authenticated and user.email == "nurse@example.com":
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only nurse@example.com can delete test results.")
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# New imports for upcoming appointments endpoint
from rest_framework.decorators import action
from django.utils import timezone

# API view for recent diagnoses and test results
class RecentDiagnosesAndResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        diagnoses = user.diagnoses.all().order_by('-date', '-created_at')[:10]
        test_results = user.test_results.all().order_by('-date', '-created_at')[:10]
        # Combine and sort by date, then created_at
        combined = [
            {"type": "Diagnosis", **DiagnosisSerializer(d).data} for d in diagnoses
        ] + [
            {"type": "Test Result", **TestResultSerializer(t).data} for t in test_results
        ]
        combined.sort(key=lambda x: (x['date'], x['created_at']), reverse=True)
        return Response(combined)
import uuid


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()

    def get_queryset(self):
        # Only return appointments for the authenticated user or for their children
        user = self.request.user
        qs = Appointment.objects.filter(patient=user)
        child_account_id = self.request.query_params.get('child_account')
        if child_account_id:
            qs = qs.filter(child_account_id=child_account_id)
        return qs
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='upcoming', permission_classes=[permissions.IsAuthenticated])
    def upcoming(self, request):
        today = timezone.now().date()
        # All appointments scheduled for today or in the future
        upcoming_appointments = Appointment.objects.filter(scheduled_date__gte=today).order_by('scheduled_date', 'scheduled_time')
        serializer = self.get_serializer(upcoming_appointments, many=True)
        return Response(serializer.data)
    

    def perform_create(self, serializer):
        from datetime import time, timedelta, datetime
        save_kwargs = {'patient': self.request.user}

        # Try to get clinic_id from patient profile, else use frontend value
        clinic_id = None
        try:
            profile = getattr(self.request.user, 'patient_profile', None)
            if profile and profile.clinic_id:
                clinic_id = profile.clinic_id
        except Exception:
            clinic_id = None
        if not clinic_id:
            clinic_id = serializer.validated_data.get('clinic_id')
        if clinic_id:
            save_kwargs['clinic_id'] = clinic_id

        # Attach child_account if provided
        child_account = serializer.validated_data.get('child_account')
        if child_account:
            save_kwargs['child_account'] = child_account

        # default status
        if not serializer.validated_data.get('status'):
            save_kwargs['status'] = 'scheduled'

        # generate a simple unique order number when missing
        if not serializer.validated_data.get('order_number'):
            save_kwargs['order_number'] = f"APPT-{uuid.uuid4().hex[:8].upper()}"

        # Enforce slot limits: 8am-4pm, 2-hour slots, max 30 patients per slot
        scheduled_date = serializer.validated_data.get('scheduled_date')
        scheduled_time = serializer.validated_data.get('scheduled_time')
        if scheduled_date is None or scheduled_time is None:
            raise Exception('You must select a date and time for your appointment.')

        # Define slot boundaries
        slot_start = scheduled_time.replace(minute=0, second=0, microsecond=0)
        slot_hour = slot_start.hour
        if slot_hour < 8 or slot_hour >= 16:
            raise Exception('Booking is only allowed between 8am and 4pm.')
        # Find the 2-hour slot start
        slot_base = (slot_hour - 8) // 2 * 2 + 8
        slot_start = time(slot_base, 0)
        slot_end = (datetime.combine(scheduled_date, slot_start) + timedelta(hours=2)).time()

        # Count existing appointments in this slot
        slot_appointments = Appointment.objects.filter(
            scheduled_date=scheduled_date,
            scheduled_time__gte=slot_start,
            scheduled_time__lt=slot_end
        ).count()
        if slot_appointments >= 30:
            # Check if all slots for the day are full
            all_slots_full = True
            for base in range(8, 16, 2):
                s_start = time(base, 0)
                s_end = (datetime.combine(scheduled_date, s_start) + timedelta(hours=2)).time()
                count = Appointment.objects.filter(
                    scheduled_date=scheduled_date,
                    scheduled_time__gte=s_start,
                    scheduled_time__lt=s_end
                ).count()
                if count < 30:
                    all_slots_full = False
                    break
            if all_slots_full:
                raise Exception('All time frames for this day are full. Please pick the next day.')
            else:
                raise Exception('The time frame is full, please pick another time frame.')

        serializer.save(**save_kwargs)


from rest_framework import filters
from .models import Doctor
from .serializers import DoctorSerializer


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    """List available doctors. Query params supported: clinic_id, date, time.

    This is intentionally simple: availability by date/time is not enforced
    server-side — the frontend can call this endpoint and show doctors that
    belong to the selected clinic. Future improvements can consult a schedule
    table to filter by free slots.
    """
    queryset = Doctor.objects.filter(is_active=True).order_by('display_name')
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['display_name', 'clinic_id']

    def get_queryset(self):
        qs = super().get_queryset()
        clinic_id = self.request.query_params.get('clinic_id')
        if clinic_id:
            qs = qs.filter(clinic_id=clinic_id)
        return qs
