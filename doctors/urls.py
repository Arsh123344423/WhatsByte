from django.urls import path
from .views import DoctorListCreateView, DoctorDetailView

urlpatterns = [
    path('', DoctorListCreateView.as_view(), name='doctor_list_create'),
    path('<int:id>/', DoctorDetailView.as_view(), name='doctor_detail'),
]
