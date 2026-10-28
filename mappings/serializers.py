from rest_framework import serializers
from .models import PatientDoctorMapping
from patients.models import Patient
from doctors.models import Doctor
from patients.serializers import PatientSerializer
from doctors.serializers import DoctorSerializer
from accounts.serializers import UserSerializer


class PatientDoctorMappingSerializer(serializers.ModelSerializer):
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source='patient',
        write_only=True
    )
    doctor_id = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(),
        source='doctor',
        write_only=True
    )
    patient = PatientSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    assigned_by = UserSerializer(read_only=True)

    class Meta:
        model = PatientDoctorMapping
        fields = [
            'id',
            'patient_id',
            'doctor_id',
            'patient',
            'doctor',
            'notes',
            'assigned_by',
            'assigned_at',
        ]
        read_only_fields = ['id', 'patient', 'doctor', 'assigned_by', 'assigned_at']

    def validate(self, attrs):
        patient = attrs.get('patient')
        doctor = attrs.get('doctor')

        if PatientDoctorMapping.objects.filter(patient=patient, doctor=doctor).exists():
            raise serializers.ValidationError(
                f"Doctor '{doctor.name}' is already assigned to Patient '{patient.name}'."
            )
        return attrs


class PatientAssignedDoctorSerializer(serializers.ModelSerializer):
    """
    Serializer to represent the doctor assigned to a patient,
    along with mapping metadata.
    """
    doctor = DoctorSerializer(read_only=True)
    mapping_id = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = PatientDoctorMapping
        fields = ['mapping_id', 'doctor', 'notes', 'assigned_at']
