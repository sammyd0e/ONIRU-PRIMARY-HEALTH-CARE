from django.urls import path
from .views import MeView, ChildAccountCreateView, PatientProfileCreateView, SignupView, PatientProfileByClinicIdView, ProfilePictureUploadView, forgot_password

urlpatterns = [
	path('me/', MeView.as_view(), name='me-profile'),
    path('child-accounts/create/', ChildAccountCreateView.as_view(), name='child-account-create'),
    path('patient-profiles/', PatientProfileCreateView.as_view(), name='patient-profile-create'),
    path('patient-profile-by-clinic-id/', PatientProfileByClinicIdView.as_view(), name='patient-profile-by-clinic-id'),
    path('profile-picture/', ProfilePictureUploadView.as_view(), name='profile-picture-upload'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('forgot-password/', forgot_password, name='forgot-password'),
]
