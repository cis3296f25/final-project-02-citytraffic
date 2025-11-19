from django.db import models

class CityEdit(models.Model):
    title = models.CharField(max_length=200, default="Untitled City")
    grid_data = models.JSONField(default=list)  # Stores the entire grid
    rows = models.IntegerField(default=16)
    cols = models.IntegerField(default=25)
    selected_tool = models.CharField(max_length=50, default="select")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.rows}x{self.cols})"
    
    class Meta:
        ordering = ['-updated_at']