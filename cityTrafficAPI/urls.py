from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewset with it.
router = DefaultRouter()
router.register(r'layouts', views.LayoutViewSet)

urlpatterns = [
    # This generates the URLs for /layouts/
    path('', include(router.urls)),
    
    # Keep your hello world test
    path('hello/', views.hello_world, name='hello'),
]