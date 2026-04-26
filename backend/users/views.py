from django.contrib.auth import get_user_model
from rest_framework import generics
from .serializers import SignupSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import SignupSerializer, EmailTokenObtainPairSerializer
from .models import PatientProfile
from .serializers import PatientProfileSerializer
from .models import ChildAccount
from .serializers import ChildAccountSerializer
import random
import string
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from .models import PatientProfile
from .serializers import PatientProfileSerializer
from rest_framework.parsers import MultiPartParser, FormParser

# Signup API view
class SignupView(generics.GenericAPIView):
	serializer_class = SignupSerializer
	permission_classes = []

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		User = get_user_model()
		user = User.objects.create_user(
			email=serializer.validated_data['email'],
			password=serializer.validated_data['password'],
			first_name=serializer.validated_data.get('first_name', ''),
			last_name=serializer.validated_data.get('last_name', ''),
		)
		# Optionally create PatientProfile or other related models here
		return Response({'detail': 'User created successfully.'}, status=status.HTTP_201_CREATED)
 # from .serializers import ChildAppointmentSerializer
# class ChildAppointmentCreateView(generics.CreateAPIView):
# 	serializer_class = ChildAppointmentSerializer
# 	permission_classes = [IsAuthenticated]
#
# 	def post(self, request, *args, **kwargs):
# 		serializer = self.get_serializer(data=request.data)
# 		serializer.is_valid(raise_exception=True)
# 		self.perform_create(serializer)
# 		return Response(serializer.data, status=status.HTTP_201_CREATED)
from django.shortcuts import render
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import SignupSerializer, EmailTokenObtainPairSerializer
from .models import PatientProfile
from .serializers import PatientProfileSerializer
from .models import ChildAccount
from .serializers import ChildAccountSerializer
import random
import string
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from .models import PatientProfile
from .serializers import PatientProfileSerializer
from rest_framework.parsers import MultiPartParser, FormParser

# API view for creating a child account
class ChildAccountCreateView(generics.CreateAPIView):
	serializer_class = ChildAccountSerializer
	permission_classes = [IsAuthenticated]

	def post(self, request, *args, **kwargs):
		parent = request.user
		# Expect child_profile_id in request data (already created PatientProfile)
		serializer = self.get_serializer(data={**request.data, 'parent_id': parent.id})
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		return Response(serializer.data, status=status.HTTP_201_CREATED)


class SignupView(APIView):
	authentication_classes = []
	permission_classes = []

	logger = logging.getLogger(__name__)

	def post(self, request):
		serializer = SignupSerializer(data=request.data)
		if not serializer.is_valid():
			return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

		data = serializer.validated_data
		# Log incoming signup data (avoid logging the password)
		log_data = {k: v for k, v in data.items() if k != 'password'}
		self.logger.info('Signup attempt: %s', log_data)

		# Create a Django user if you use the default User model
		User = get_user_model()
		email = data.get('email')
		first_name = data.get('first_name')
		last_name = data.get('last_name')
		othername = data.get('othername', '')
		password = data.get('password')

		# Determine the user model's username field (could be 'username' or 'email' on custom models)
		username_field = getattr(User, 'USERNAME_FIELD', 'username')

		# Derive lookup value for uniqueness check and for create_user kwargs
		# If the username field is 'email', use the submitted email; otherwise fall back to email
		lookup_field = 'email' if username_field == 'email' else username_field
		lookup_value = data.get(lookup_field) or email

		# Check uniqueness using the appropriate field
		if User.objects.filter(**{lookup_field: lookup_value}).exists():
			return Response({'error': 'A user with that email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

		# Build kwargs for create_user so we always pass the model's required username arg
		create_kwargs = {'password': password, 'first_name': first_name, 'last_name': last_name}
		create_kwargs[username_field] = lookup_value
		# Ensure email is set on the model if it's a separate field
		if username_field != 'email':
			create_kwargs['email'] = email

		# Create user - using create_user to hash password
		user = User.objects.create_user(**create_kwargs)

		patient = PatientProfile.objects.create(
			user=user,
			first_name=first_name,
			last_name=last_name,
			othername=othername,
			sex=data.get('sex'),
			blood_group=data.get('bloodGroup'),
			dob=data.get('dob'),
			state_of_origin=data.get('stateOfOrigin'),
			next_of_kin=data.get('nextOfKin'),
			house_address=data.get('houseAddress'),
		)

		# Generate a unique 6-character alphanumeric clinic ID for this patient
		def _generate_clinic_id(length=6):
			chars = string.ascii_uppercase + string.digits
			return ''.join(random.choices(chars, k=length))

		for _ in range(10):
			candidate = _generate_clinic_id(6)
			if not PatientProfile.objects.filter(clinic_id=candidate).exists():
				patient.clinic_id = candidate
				patient.save()
				break
		else:
			# Fallback: use a longer ID if collisions prevented a 6-char unique value
			candidate = _generate_clinic_id(10)
			patient.clinic_id = candidate
			patient.save()

		# You can store extra fields on a profile model or user if extended.
		safe_data = {k: v for k, v in data.items() if k != 'password'}
		full_name = (patient.first_name or '') + (' ' + patient.othername if patient.othername else '') + (' ' + patient.last_name if patient.last_name else '')
		response_payload = {
			'success': True,
			'user': {
				'id': user.id,
				'email': user.email,
				'first_name': user.first_name,
				'last_name': user.last_name,
			},
			'profile_id': patient.id,
			'clinicId': patient.clinic_id,
			'submitted': { 
				'first_name': first_name,
				'last_name': last_name,
				'othername': othername,
				'sex': data.get('sex'),
				'bloodGroup': data.get('bloodGroup'),
				'dob': data.get('dob'),
				'stateOfOrigin': data.get('stateOfOrigin'),
				'houseAddress': data.get('houseAddress'),
				'nextOfKin': data.get('nextOfKin'),
				'phone': data.get('phone'),
				'email': data.get('email'),
				'full_name': full_name.strip(),
			},
			'profile': {
				'first_name': patient.first_name,
				'last_name': patient.last_name,
				'othername': patient.othername,
				'phone': patient.phone if hasattr(patient, 'phone') else data.get('phone', ''),
				'full_name': full_name.strip(),
				'sex': patient.sex,
				'bloodGroup': patient.blood_group,
				'dob': patient.dob.isoformat() if patient.dob else None,
				'stateOfOrigin': patient.state_of_origin,
				'nextOfKin': patient.next_of_kin,
				'houseAddress': patient.house_address,
				'clinicId': patient.clinic_id,
			},
		}
		self.logger.info('Signup success for email=%s user_id=%s profile_id=%s', user.email, user.id, patient.id)
		return Response(response_payload, status=status.HTTP_201_CREATED)


class MeView(APIView):
	"""Return the authenticated user's basic info and patient profile."""
	permission_classes = [IsAuthenticated]


	def get(self, request):
		user = request.user
		try:
			profile = getattr(user, 'patient_profile', None)
		except Exception:
			profile = None

		profile_data = None
		if profile:
			profile_data = PatientProfileSerializer(profile).data

		# Get child accounts for this parent
		child_accounts = ChildAccount.objects.filter(parent=user)
		child_profiles = [ChildAccountSerializer(child).data for child in child_accounts]

		data = {
			'user': {
				'id': user.id,
				'email': user.email,
				'first_name': getattr(user, 'first_name', ''),
			},
			'profile': profile_data,
			'children': child_profiles,
		}
		return Response(data)

	def patch(self, request):
		user = request.user
		try:
			profile = getattr(user, 'patient_profile', None)
		except Exception:
			profile = None

		# Separate user and profile fields
		user_fields = ['first_name', 'last_name', 'email', 'phone_number']
		user_data = {k: v for k, v in request.data.items() if k in user_fields}
		profile_data = {k: v for k, v in request.data.items() if k not in user_fields}

		# Update user fields if present
		user_updated = False
		if user_data:
			from .serializers import UserUpdateSerializer
			user_serializer = UserUpdateSerializer(user, data=user_data, partial=True)
			if user_serializer.is_valid():
				user_serializer.save()
				user_updated = True
			else:
				return Response({'success': False, 'errors': user_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

		# Update profile fields if present
		profile_updated = False
		profile_serializer = None
		if profile and profile_data:
			profile_serializer = PatientProfileSerializer(profile, data=profile_data, partial=True)
			if profile_serializer.is_valid():
				profile_serializer.save()
				profile_updated = True
			else:
				return Response({'success': False, 'errors': profile_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

		# Prepare response
		response_data = {'success': True}
		if user_updated:
			response_data['user'] = UserUpdateSerializer(user).data
		if profile_updated and profile_serializer:
			response_data['profile'] = profile_serializer.data
		if not (user_updated or profile_updated):
			response_data['message'] = 'No changes made.'
		return Response(response_data)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer



from rest_framework.permissions import AllowAny

class PatientProfileCreateView(generics.CreateAPIView):
	queryset = PatientProfile.objects.all()
	serializer_class = PatientProfileSerializer
	permission_classes = [AllowAny]

	def perform_create(self, serializer):
		# Always create child patient profiles with user=None
		serializer.save(user=None)

class PatientProfileByClinicIdView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		clinic_id = request.GET.get('clinic_id')
		if not clinic_id:
			return Response({'error': 'clinic_id is required'}, status=400)
		try:
			profile = PatientProfile.objects.get(clinic_id=clinic_id)
		except PatientProfile.DoesNotExist:
			return Response({'error': 'Profile not found'}, status=404)
		data = PatientProfileSerializer(profile).data
		return Response({'profile': data})

	def patch(self, request):
		# Only allow staff (nurse/admin) to update any patient profile
		if not request.user.is_staff:
			return Response({'error': 'Permission denied. Only staff can update patient vitals.'}, status=403)
		clinic_id = request.GET.get('clinic_id')
		if not clinic_id:
			return Response({'error': 'clinic_id is required'}, status=400)
		try:
			profile = PatientProfile.objects.get(clinic_id=clinic_id)
		except PatientProfile.DoesNotExist:
			return Response({'error': 'Profile not found'}, status=404)
		serializer = PatientProfileSerializer(profile, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response({'profile': serializer.data})
		return Response({'error': serializer.errors}, status=400)

class ProfilePictureUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, *args, **kwargs):
        user = request.user
        profile = getattr(user, 'patient_profile', None)
        if not profile:
            return Response({'error': 'No profile found.'}, status=404)
        file = request.FILES.get('profile_picture')
        if not file:
            return Response({'error': 'No file uploaded.'}, status=400)
        profile.profile_picture = file
        profile.save()
        from .serializers import PatientProfileSerializer
        return Response({'profile_picture': PatientProfileSerializer(profile).data['profile_picture']})

DEBUG = False
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

