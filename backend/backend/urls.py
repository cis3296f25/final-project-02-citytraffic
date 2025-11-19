from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from edits_api import views

router = DefaultRouter()
router.register(r'city-edits', views.CityEditViewSet, basename='city-edits')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]