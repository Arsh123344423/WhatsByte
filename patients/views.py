from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer


class PatientListCreateView(generics.ListCreateAPIView):
    """
    POST /api/patients/ - Add a new patient (Authenticated users only)
    GET /api/patients/  - Retrieve all patients created by the authenticated user
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        all_param = self.request.query_params.get('all', '').lower() in ('true', '1')
        if all_param and (getattr(user, 'role', '') == 'admin' or user.is_staff or user.is_superuser):
            return Patient.objects.all()
        # Retrieve all patients created by the authenticated user
        return Patient.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Patient created successfully.",
                "patient": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/patients/<id>/    - Get details of a specific patient
    PUT /api/patients/<id>/    - Update patient details (full update)
    PATCH /api/patients/<id>/  - Partial update patient details
    DELETE /api/patients/<id>/ - Delete a patient record
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Patient.objects.filter(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            {
                "message": "Patient updated successfully.",
                "patient": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {
                "message": "Patient deleted successfully."
            },
            status=status.HTTP_200_OK
        )
