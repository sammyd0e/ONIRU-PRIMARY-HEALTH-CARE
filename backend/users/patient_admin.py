from django.contrib import admin
from .models import PatientProfile

# NOTE: PatientProfile is already registered in admin.py
# This file is kept for reference but registration is commented out to avoid duplicates

# @admin.register(PatientProfile)
# class PatientProfileAdmin(admin.ModelAdmin):
#     list_display = (
#         'user', 'sex', 'blood_group', 'dob', 'state_of_origin', 'next_of_kin', 'house_address', 'clinic_id', 'created_at', 'updated_at'
#     )
#     search_fields = ('user__email', 'clinic_id', 'sex', 'blood_group', 'state_of_origin', 'next_of_kin')
#     list_filter = ('sex', 'blood_group', 'state_of_origin')
#     readonly_fields = ('created_at', 'updated_at')
