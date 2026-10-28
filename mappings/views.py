from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import PatientDoctorMapping
from .serializers import PatientDoctorMappingSerializer, PatientAssignedDoctorSerializer
from patients.models import Patient
from doctors.models import Doctor


class MappingListCreateView(generics.ListCreateAPIView):
    """
    POST /api/mappings/ - Assign a doctor to a patient
    GET  /api/mappings/ - Retrieve all patient-doctor mappings (supports ?doctor_id= & ?patient_id=)
    """
    serializer_class = PatientDoctorMappingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PatientDoctorMapping.objects.all().select_related('patient', 'doctor', 'assigned_by')
        doctor_id = self.request.query_params.get('doctor_id')
        patient_id = self.request.query_params.get('patient_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

    def create(self, request, *args, **kwargs):
        # Allow flexible field names (patient or patient_id, doctor or doctor_id)
        data = request.data.copy()
        if 'patient' in data and 'patient_id' not in data:
            data['patient_id'] = data.get('patient')
        if 'doctor' in data and 'doctor_id' not in data:
            data['doctor_id'] = data.get('doctor')

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Doctor assigned to patient successfully.",
                "mapping": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class MappingDetailView(APIView):
    """
    Handles:
    GET    /api/mappings/<patient_id>/ - Get all doctors assigned to a specific patient
    DELETE /api/mappings/<id>/         - Remove a doctor from a patient (by mapping id or patient id with doctor_id)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, identifier, *args, **kwargs):
        """
        GET /api/mappings/<patient_id>/ - Get all doctors assigned to a specific patient.
        If identifier is a patient id, return assigned doctors.
        If identifier matches a mapping id, return that mapping details as fallback.
        """
        # First check if patient exists with this ID
        patient = Patient.objects.filter(id=identifier).first()
        if patient:
            mappings = PatientDoctorMapping.objects.filter(patient=patient).select_related('doctor')
            serializer = PatientAssignedDoctorSerializer(mappings, many=True)
            return Response(
                {
                    "patient_id": patient.id,
                    "patient_name": patient.name,
                    "total_assigned_doctors": mappings.count(),
                    "assigned_doctors": serializer.data
                },
                status=status.HTTP_200_OK
            )

        # Fallback: check if identifier is a mapping ID
        mapping = PatientDoctorMapping.objects.filter(id=identifier).first()
        if mapping:
            serializer = PatientDoctorMappingSerializer(mapping)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {
                "status": "error",
                "message": f"Patient with ID {identifier} not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    def delete(self, request, identifier, *args, **kwargs):
        """
        DELETE /api/mappings/<id>/ - Remove a doctor from a patient.
        Can delete by mapping ID directly, or if identifier is patient_id with doctor_id in params/body.
        """
        # Try finding mapping by ID first
        mapping = PatientDoctorMapping.objects.filter(id=identifier).first()

        if not mapping:
            # Check if identifier is patient_id and doctor_id was provided
            doctor_id = request.data.get('doctor_id') or request.query_params.get('doctor_id')
            if doctor_id:
                mapping = PatientDoctorMapping.objects.filter(
                    patient_id=identifier,
                    doctor_id=doctor_id
                ).first()

        if not mapping:
            return Response(
                {
                    "status": "error",
                    "message": f"Mapping record with ID {identifier} not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        patient_name = mapping.patient.name
        doctor_name = mapping.doctor.name
        mapping.delete()

        return Response(
            {
                "message": f"Successfully removed Dr. {doctor_name} from Patient {patient_name}."
            },
            status=status.HTTP_200_OK
        )
