from rest_framework import serializers
from .models import CityLayout

class CityLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CityLayout
        fields = ['id', 'name', 'description', 'rows', 'cols', 'grid_data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']