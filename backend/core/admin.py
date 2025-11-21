from django.contrib import admin
from .models import CityLayout

@admin.register(CityLayout)
class CityLayoutAdmin(admin.ModelAdmin):
    list_display = ['name', 'rows', 'cols', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']