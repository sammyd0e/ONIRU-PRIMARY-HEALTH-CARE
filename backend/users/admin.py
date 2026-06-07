from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.forms import ModelForm
from django.core.exceptions import ValidationError
from django import forms
from .models import User, SellerProfile, Address, PatientProfile, ChildAccount


class PatientProfileForm(forms.ModelForm):
    """Custom form for PatientProfile that validates FK relationships."""
    class Meta:
        model = PatientProfile
        fields = '__all__'
    
    def clean(self):
        cleaned_data = super().clean()
        user = cleaned_data.get('user')
        
        # If we're editing an existing PatientProfile
        if self.instance.pk:
            # Check if this PatientProfile has a related ChildAccount
            has_child_account = ChildAccount.objects.filter(child_profile_id=self.instance.pk).exists()
            if user is None and has_child_account:
                raise ValidationError(
                    'Cannot clear the user field: this PatientProfile is linked to a Child Account. '
                    'Either delete the Child Account first or keep the user assigned.'
                )
        
        return cleaned_data
# Register PatientProfile for admin display
@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    form = PatientProfileForm
    list_display = (
        'user', 'first_name', 'last_name', 'sex', 'blood_group', 'dob', 'state_of_origin', 'next_of_kin', 'house_address', 'clinic_id', 'created_at', 'updated_at'
    )
    search_fields = ('user__email', 'clinic_id', 'sex', 'blood_group', 'state_of_origin', 'next_of_kin')
    list_filter = ('sex', 'blood_group', 'state_of_origin')
    readonly_fields = ('created_at', 'updated_at', 'clinic_id')
    fieldsets = (
        ('User Link', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'othername', 'sex', 'dob')
        }),
        ('Medical Information', {
            'fields': ('blood_group', 'state_of_origin', 'next_of_kin', 'house_address')
        }),
        ('Vitals', {
            'fields': ('blood_pressure', 'sugar_level', 'cholesterol_level', 'weight', 'height')
        }),
        ('Profile', {
            'fields': ('profile_picture', 'clinic_id')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make user field readonly if PatientProfile has a related ChildAccount."""
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and ChildAccount.objects.filter(child_profile_id=obj.pk).exists():
            if 'user' not in readonly:
                readonly.append('user')
        return readonly

@admin.register(User)
class CustomerAdmin(UserAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'is_seller', 'is_buyer','is_staff','is_active')
    list_filter = ('is_seller', 'is_buyer', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number')}),
        ('Permissions', {'fields': ('is_seller', 'is_buyer', 'is_staff', 'is_active')}),
        ('Important_dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'is_seller', 'is_buyer', 'is_staff', 'is_active')
        }),
    )
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)



@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'kyc_status', 'business_is_verified', 'created_at', 'updated_at')
    list_filter = ('kyc_status', 'business_is_verified')
    search_fields = ('business_name', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

# @admin.register(UserProfile)
# class UserProfileAdmin(admin.ModelAdmin):
#     list_display = ('user', 'preferred_currency', 'created_at')
#     search_fields = ('user__email')

@admin.register(Address)
class AdressAdmin(admin.ModelAdmin):
    list_display = ('user', 'street_address', 'city', 'country', 'is_default', 'address_type')
    list_filter = ('country', 'address_type', 'is_default')
    search_fields = ('user__email', 'street_address', 'city') 

@admin.register(ChildAccount)
class ChildAccountAdmin(admin.ModelAdmin):
    list_display = ('parent', 'child_profile', 'bloodgroup', 'created_at')
    search_fields = ('parent__email',)
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Account Links', {
            'fields': ('parent', 'child_profile')
        }),
        ('Medical Information', {
            'fields': ('bloodgroup',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Override save to ensure FK constraints are respected."""
        try:
            # Validate that child_profile has a user assigned
            if obj.child_profile and not obj.child_profile.user:
                raise ValidationError(
                    'The child profile must have a user assigned before linking to a parent account.'
                )
            super().save_model(request, obj, form, change)
        except ValidationError as e:
            raise
        except Exception as e:
            if 'FOREIGN KEY constraint failed' in str(e):
                raise ValidationError(
                    f'Foreign key constraint error: {str(e)}. '
                    f'This usually means the child profile is missing required relationships. '
                    f'Please ensure the child profile has a user assigned.'
                )
            raise

# UI-only labels: treat User as Patient (and SellerProfile as ProviderProfile)
try:
    User._meta.verbose_name = "Patient"
    User._meta.verbose_name_plural = "Patients"
    SellerProfile._meta.verbose_name = "Provider Profile"
    SellerProfile._meta.verbose_name_plural = "Provider Profiles"
    Address._meta.verbose_name = "Contact Address"
    Address._meta.verbose_name_plural = "Contact Addresses"
except Exception:
    pass
