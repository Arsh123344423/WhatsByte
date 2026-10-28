from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Doctor
from .serializers import DoctorSerializer


class DoctorListCreateView(generics.ListCreateAPIView):
    """
    POST /api/doctors/ - Add a new doctor (Authenticated users only)
    GET /api/doctors/  - Retrieve all doctors
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Doctor created successfully.",
                "doctor": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class DoctorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/doctors/<id>/    - Get details of a specific doctor
    PUT /api/doctors/<id>/    - Update doctor details
    PATCH /api/doctors/<id>/  - Partial update doctor details
    DELETE /api/doctors/<id>/ - Delete a doctor record
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            {
                "message": "Doctor updated successfully.",
                "doctor": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {
                "message": "Doctor deleted successfully."
            },
            status=status.HTTP_200_OK
        )
