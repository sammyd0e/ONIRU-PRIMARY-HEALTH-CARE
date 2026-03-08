from django.db import models
from django.conf import settings


class Feedback(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback_feedback'

    def __str__(self):
        return f'Feedback {self.id} by {self.user_id}'
