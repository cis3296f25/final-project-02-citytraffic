from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import CityEdit
from .serializers import CityEditSerializer

class CityEditViewSet(viewsets.ModelViewSet):
    queryset = CityEdit.objects.all().order_by('-updated_at')
    serializer_class = CityEditSerializer
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the most recently updated city"""
        latest_city = CityEdit.objects.order_by('-updated_at').first()
        if latest_city:
            serializer = self.get_serializer(latest_city)
            return Response(serializer.data)
        return Response({'detail': 'No cities found'}, status=status.HTTP_404_NOT_FOUND)