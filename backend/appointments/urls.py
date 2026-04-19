from django.urls import path, include
from rest_framework import routers
from .views import AppointmentViewSet, DoctorViewSet, RecentDiagnosesAndResultsView, daily_patient_count_by_service, appointment_by_clinic_id, AttendedPatientCreateView
from .views_arthnatal import ArthnatalBookingViewSet


router = routers.DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'arthnatal', ArthnatalBookingViewSet, basename='arthnatal')

urlpatterns = [
	path('', include(router.urls)),
	path('diagnoses/', RecentDiagnosesAndResultsView.as_view(), name='recent-diagnoses-results'),
	path('daily-patient-count/', daily_patient_count_by_service, name='daily-patient-count-by-service'),
	path('appointment-by-clinic-id/', appointment_by_clinic_id, name='appointment-by-clinic-id'),
	path('attended-patients/', AttendedPatientCreateView.as_view(), name='attended-patient-create'),
    # path('api/appointments/', include('appointments.urls')),  # Removed to prevent recursion error
]


