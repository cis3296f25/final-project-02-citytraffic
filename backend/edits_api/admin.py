from django.contrib import admin
from .models import CityEdit

@admin.register(CityEdit)
class CityEditAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'rows', 'cols', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ['id']
        return self.readonly_fields