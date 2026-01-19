from django.urls import path
from apis.views.dashboard_view import custom_dashboard_view

urlpatterns = [
    path('', custom_dashboard_view, name='custom_dashboard'),
]
