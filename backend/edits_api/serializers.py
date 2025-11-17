from rest_framework import serializers
from .models import CityEdit

class CityEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = CityEdit
        fields = ['id', 'title', 'grid_data', 'rows', 'cols', 'selected_tool', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']