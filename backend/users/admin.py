from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SellerProfile, Address, PatientProfile, ChildAccount
# Register PatientProfile for admin display
@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'first_name', 'last_name', 'sex', 'blood_group', 'dob', 'state_of_origin', 'next_of_kin', 'house_address', 'clinic_id', 'created_at', 'updated_at'
    )
    search_fields = ('user__email', 'clinic_id', 'sex', 'blood_group', 'state_of_origin', 'next_of_kin')
    list_filter = ('sex', 'blood_group', 'state_of_origin')
    readonly_fields = ('created_at', 'updated_at')

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
