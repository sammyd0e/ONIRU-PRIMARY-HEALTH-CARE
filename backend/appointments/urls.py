from django.urls import path, include
from rest_framework import routers
from .views import AppointmentViewSet, DoctorViewSet, RecentDiagnosesAndResultsView
from .views_arthnatal import ArthnatalBookingViewSet


router = routers.DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'arthnatal', ArthnatalBookingViewSet, basename='arthnatal')

urlpatterns = [
	path('', include(router.urls)),
	path('diagnoses/', RecentDiagnosesAndResultsView.as_view(), name='recent-diagnoses-results'),
]


