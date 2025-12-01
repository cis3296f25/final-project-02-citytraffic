from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Layout
from .serializers import LayoutSerializer

# Your existing hello world test
@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello from your Django API!"})

# The ViewSet that handles Save (POST), Load (GET), and Delete
class LayoutViewSet(viewsets.ModelViewSet):
    queryset = Layout.objects.all().order_by('-created_at')
    serializer_class = LayoutSerializer