from django.db import models
from django.contrib.auth.models import User

class CityLayout(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    rows = models.IntegerField(default=16)
    cols = models.IntegerField(default=25)
    grid_data = models.JSONField(default=dict)  # Stores the grid state
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.rows}x{self.cols})"