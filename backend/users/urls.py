from django.urls import path
from .views import MeView, ChildAccountCreateView, PatientProfileCreateView
# from .views import ChildAppointmentCreateView

urlpatterns = [
	path('me/', MeView.as_view(), name='me-profile'),
    path('child-accounts/create/', ChildAccountCreateView.as_view(), name='child-account-create'),
    path('patient-profiles/', PatientProfileCreateView.as_view(), name='patient-profile-create'),
#    path('child-appointments/create/', ChildAppointmentCreateView.as_view(), name='child-appointment-create'),
]
