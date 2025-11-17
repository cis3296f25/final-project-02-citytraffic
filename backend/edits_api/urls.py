from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'city-edits', views.CityEditViewSet, basename='city-edits')

urlpatterns = [
    path('', include(router.urls)),
]