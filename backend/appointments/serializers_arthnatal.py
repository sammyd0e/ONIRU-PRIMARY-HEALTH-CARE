from rest_framework import serializers
from .models_arthnatal import ArthnatalBooking

class ArthnatalBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArthnatalBooking
        fields = ['id', 'patient', 'name', 'email', 'phone', 'preferred_date', 'note', 'created_at']
        read_only_fields = ['id', 'created_at', 'patient']
