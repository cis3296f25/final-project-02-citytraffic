from django.contrib import admin
from .models import Layout

@admin.register(Layout)
class LayoutAdmin(admin.ModelAdmin):
    list_display = ('name', 'rows', 'cols', 'created_at')
    search_fields = ('name',)