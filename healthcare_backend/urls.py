from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    Healthcare Backend API Root
    Provides an index of all available endpoints.
    """
    return Response({
        "project": "Healthcare Backend API",
        "version": "1.0.0",
        "status": "healthy",
        "documentation": {
            "authentication": {
                "register": "/api/auth/register/ [POST]",
                "login": "/api/auth/login/ [POST]",
                "token_refresh": "/api/auth/token/refresh/ [POST]",
            },
            "patients": {
                "list_create": "/api/patients/ [GET, POST]",
                "detail_update_delete": "/api/patients/<id>/ [GET, PUT, PATCH, DELETE]",
            },
            "doctors": {
                "list_create": "/api/doctors/ [GET, POST]",
                "detail_update_delete": "/api/doctors/<id>/ [GET, PUT, PATCH, DELETE]",
            },
            "patient_doctor_mappings": {
                "list_create": "/api/mappings/ [GET, POST]",
                "get_doctors_by_patient": "/api/mappings/<patient_id>/ [GET]",
                "remove_doctor_mapping": "/api/mappings/<id>/ [DELETE]",
            }
        }
    })


urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/doctors/', include('doctors.urls')),
    path('api/mappings/', include('mappings.urls')),
]
