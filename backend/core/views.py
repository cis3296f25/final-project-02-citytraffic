from rest_framework import generics, status
from rest_framework.response import Response
from .models import CityLayout
from .serializers import CityLayoutSerializer

class CityLayoutListCreateView(generics.ListCreateAPIView):
    queryset = CityLayout.objects.all()
    serializer_class = CityLayoutSerializer

class CityLayoutDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CityLayout.objects.all()
    serializer_class = CityLayoutSerializer

class CityLayoutBulkDeleteView(generics.DestroyAPIView):
    def delete(self, request, *args, **kwargs):
        try:
            layout_ids = request.data.get('ids', [])
            if not layout_ids:
                return Response(
                    {'error': 'No layout IDs provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            deleted_count, _ = CityLayout.objects.filter(id__in=layout_ids).delete()
            
            return Response(
                {'message': f'Successfully deleted {deleted_count} layout(s)'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )