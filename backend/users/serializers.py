
from rest_framework import serializers
from .models import PatientProfile, User, ChildAccount
# from .models import ChildAppointment

# class ChildAppointmentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ChildAppointment
#         fields = ['id', 'child_account', 'appointment_date', 'appointment_time', 'reason', 'created_at', 'updated_at']
# Serializer for updating User fields
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number']
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone_number': {'required': False},
        }

# Serializer for PatientProfile including vitals
class PatientProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    bloodPressure = serializers.CharField(source='blood_pressure', allow_null=True, required=False)
    sugarLevel = serializers.CharField(source='sugar_level', allow_null=True, required=False)
    cholesterolLevel = serializers.CharField(source='cholesterol_level', allow_null=True, required=False)
    weight = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True, required=False)
    height = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True, required=False)
    bloodGroup = serializers.CharField(source='blood_group', allow_null=True, required=False)
    stateOfOrigin = serializers.CharField(source='state_of_origin', allow_null=True, required=False)
    nextOfKin = serializers.CharField(source='next_of_kin', allow_null=True, required=False)
    houseAddress = serializers.CharField(source='house_address', allow_null=True, required=False)
    clinicId = serializers.CharField(source='clinic_id', allow_null=True, required=False)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'othername', 'first_name', 'last_name', 'sex', 'bloodGroup', 'dob',
            'stateOfOrigin', 'nextOfKin', 'houseAddress', 'clinicId',
            'bloodPressure', 'sugarLevel', 'cholesterolLevel', 'weight', 'height',
            'profile_picture',
            'created_at', 'updated_at', 'user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    othername = serializers.CharField(max_length=150, required=False, allow_blank=True)
    sex = serializers.ChoiceField(choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')])
    bloodGroup = serializers.CharField(max_length=10, required=False, allow_blank=True)
    dob = serializers.DateField(required=False, allow_null=True)
    stateOfOrigin = serializers.CharField(max_length=100, required=False, allow_blank=True)
    houseAddress = serializers.CharField(max_length=300, required=False, allow_blank=True)
    nextOfKin = serializers.CharField(max_length=200, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if needed
        return token

    def validate(self, attrs):
        # Accept 'email' instead of 'username'
        attrs['username'] = attrs.get('email', attrs.get('username'))
        return super().validate(attrs)


class ChildAccountSerializer(serializers.ModelSerializer):
    child_profile = PatientProfileSerializer(read_only=True)
    child_profile_id = serializers.PrimaryKeyRelatedField(queryset=PatientProfile.objects.all(), source='child_profile', write_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='parent', write_only=True)
    bloodgroup = serializers.CharField(max_length=10, required=False, allow_blank=True)

    class Meta:
        model = ChildAccount
        fields = ['id', 'parent_id', 'child_profile_id', 'child_profile', 'bloodgroup', 'created_at']
