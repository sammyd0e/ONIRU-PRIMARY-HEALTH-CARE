from rest_framework import viewsets, permissions
from .models_arthnatal import ArthnatalBooking
from .serializers_arthnatal import ArthnatalBookingSerializer

class ArthnatalBookingViewSet(viewsets.ModelViewSet):
    queryset = ArthnatalBooking.objects.all()
    serializer_class = ArthnatalBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return arthnatal bookings for the authenticated user
        return ArthnatalBooking.objects.filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)
