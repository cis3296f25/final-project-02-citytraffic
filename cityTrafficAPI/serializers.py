from rest_framework import serializers
from .models import Layout

class LayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layout
        fields = ['id', 'name', 'description', 'rows', 'cols', 'grid_data', 'created_at']