from django.db import models

class Layout(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    rows = models.IntegerField()
    cols = models.IntegerField()
    # Stores the entire 2D grid array as JSON
    grid_data = models.JSONField() 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name