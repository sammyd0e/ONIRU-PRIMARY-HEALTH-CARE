"""
URL configuration for clinic project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from appointments.views import AppointmentViewSet, DoctorViewSet
from feedback.views import FeedbackViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import SignupView, MeView, EmailTokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static

# Top-level URL patterns. We register both the original ecommerce prefixes
# and the clinical aliases so external clients can use either during the
# migration/transition period. The root path redirects to the admin site so
# visiting `/` in a browser shows something useful instead of a 404.
urlpatterns = [
    path('', RedirectView.as_view(url='admin/', permanent=False)),
    path('admin/', admin.site.urls),
    # Appointments
    path('appointments/', include('appointments.urls')),
    # Feedback
    path('feedback/', include('feedback.urls')),
    # Users / patients
    path('users/', include('users.urls')),
    path('patients/', include('users.urls')),
    # API endpoints for appointments (including arthnatal) and users
    path('api/', include('appointments.urls')),
    path('api/', include('users.urls')),
]

# API router
router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'doctors', DoctorViewSet, basename='doctor')

urlpatterns += [
    path('api/', include((router.urls, 'api'), namespace='api')),
    path('api/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#    path('api/signup/', SignupView.as_view(), name='api-signup'),
#    path('api/me/', MeView.as_view(), name='api-me'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
