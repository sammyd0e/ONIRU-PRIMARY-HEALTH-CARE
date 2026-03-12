# appointments/views.py
from rest_framework import viewsets, permissions
from .models import Appointment
from .serializers import AppointmentSerializer, DiagnosisSerializer, TestResultSerializer
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
