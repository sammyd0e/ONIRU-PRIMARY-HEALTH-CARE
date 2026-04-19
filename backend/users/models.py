from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """Custom user manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True, null=True)
    is_seller = models.BooleanField(_('is seller'), default=False)
    is_buyer = models.BooleanField(_('is buyer'), default=True)
    phone_verified = models.BooleanField(_('phone verified'), default=False)
    email_verified = models.BooleanField(_('email verified'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now_add=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions'
    )

    username = None
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    # Use custom manager that understands email as the USERNAME_FIELD
    objects = CustomUserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email
    

class SellerProfile(models.Model):
    KYC_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(
        User, 
        on_delete= models.CASCADE,
        related_name= 'seller_profile',
    )

    business_name = models.CharField(_('business name'), max_length=255, blank=True, null=True)
    business_description = models.TextField(_('business decription'), blank=True)
    business_address = models.TextField(_('business address'), blank=True)
    business_phone_number = models.CharField(_('busines phone'), max_length=20, blank=True, null=True)
    business_is_verified = models.BooleanField(_('verified'), default=False)
    kyc_status = models.CharField(
        max_length=20,
        choices= KYC_STATUS_CHOICES,
        default= 'pending',
    )
    kyc_documents = models.JSONField(default=dict, blank=True)
    payout_info = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = 'seller_profile'

    def __str__(self):
        return f"{self.business_name} - {self.user.email}"
    

class Address(models.Model):
    ADDRESS_TYPE_CHOICES = [
        ('billing', 'Billing'),
        ('shipping', 'Shipping'),
        ('both', 'Both'),
    ]

    user = models.ForeignKey(
        User,
        on_delete= models.CASCADE,
        related_name= 'addresses',
    )

    address_type = models.CharField(
        max_length= 20,
        choices= ADDRESS_TYPE_CHOICES,
        default= 'shipping'
    )

    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=100)
    is_default =models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'addresses'
        verbose_name_plural = 'addresses'

    def __str__(self):
        return f"{self.street_address}, {self.city}, {self.country}"


class PatientProfile(models.Model):
    othername = models.CharField(max_length=150, blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        blank=True,
        null=True
    )

    sex = models.CharField(max_length=20, choices=SEX_CHOICES, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    state_of_origin = models.CharField(max_length=100, blank=True, null=True)
    next_of_kin = models.CharField(max_length=200, blank=True, null=True)
    house_address = models.CharField(max_length=300, blank=True, null=True)

    # Vitals
    blood_pressure = models.CharField(max_length=20, blank=True, null=True, help_text="e.g. 120/80 mmHg")
    sugar_level = models.CharField(max_length=20, blank=True, null=True, help_text="e.g. 90 mg/dL")
    cholesterol_level = models.CharField(max_length=20, blank=True, null=True, help_text="e.g. 180 mg/dL")
    weight = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, help_text="kg")
    height = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="cm")


    # Profile picture
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    # A short unique alphanumeric clinic ID shown on user profiles and used when booking
    clinic_id = models.CharField(max_length=12, unique=True, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient_profile'

    def __str__(self):
        if self.user and hasattr(self.user, "email"):
            return f"PatientProfile: {self.user.email}"
        return "PatientProfile: No user"


class ChildAccount(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='child_accounts')
    child_profile = models.OneToOneField('PatientProfile', on_delete=models.CASCADE, related_name='parent_link')
    bloodgroup = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'child_account'
        verbose_name = 'Child Account'
        verbose_name_plural = 'Child Accounts'

    def __str__(self):
        try:
            parent_email = getattr(self.parent, 'email', 'None') if self.parent else 'None'
        except Exception:
            parent_email = 'None'
        try:
            child_profile = self.child_profile if hasattr(self, 'child_profile') else None
            child_user = child_profile.user if child_profile and hasattr(child_profile, 'user') else None
            child_email = getattr(child_user, 'email', 'None') if child_user else 'None'
        except Exception:
            child_email = 'None'
        return f"ChildAccount: parent={parent_email}, child={child_email}"

    # Move ChildAppointment model definition here
    class ChildAppointment(models.Model):
        child_account = models.ForeignKey('ChildAccount', on_delete=models.CASCADE, related_name='appointments')
        appointment_date = models.DateField()
        appointment_time = models.TimeField()
        reason = models.CharField(max_length=255, blank=True, null=True)
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)

        class Meta:
            db_table = 'child_appointment'
            verbose_name = 'Child Appointment'
            verbose_name_plural = 'Child Appointments'

        def __str__(self):
            return f"ChildAppointment for {self.child_account.child_profile} on {self.appointment_date}"






