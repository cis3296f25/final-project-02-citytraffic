from django.urls import path
from . import views

urlpatterns = [
    path('layouts/', views.CityLayoutListCreateView.as_view(), name='layout-list-create'),
    path('layouts/<int:pk>/', views.CityLayoutDetailView.as_view(), name='layout-detail'),
    path('layouts/bulk-delete/', views.CityLayoutBulkDeleteView.as_view(), name='layout-bulk-delete'),
]