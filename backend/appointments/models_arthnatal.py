from django.db import models
from django.conf import settings

class ArthnatalBooking(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='arthnatal_bookings')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=32)
    preferred_date = models.DateField()
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Arthnatal booking for {self.name} on {self.preferred_date}"
