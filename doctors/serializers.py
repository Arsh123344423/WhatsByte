import re
from rest_framework import serializers
from .models import Doctor
from accounts.serializers import UserSerializer


class DoctorSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id',
            'name',
            'specialization',
            'contact_number',
            'email',
            'years_of_experience',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Doctor name cannot be empty.")
        return value.strip()

    def validate_specialization(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Specialization cannot be empty.")
        return value.strip()

    def validate_email(self, value):
        normalized_email = value.lower().strip()
        instance = getattr(self, 'instance', None)
        qs = Doctor.objects.filter(email__iexact=normalized_email)
        if instance:
            qs = qs.exclude(id=instance.id)
        if qs.exists():
            raise serializers.ValidationError("A doctor with this email address already exists.")
        return normalized_email

    def validate_contact_number(self, value):
        value = value.strip()
        digits = re.sub(r'\D', '', value)
        if len(digits) < 7 or len(digits) > 15:
            raise serializers.ValidationError("Contact number must contain between 7 and 15 digits.")
        return value

    def validate_years_of_experience(self, value):
        if value < 0 or value > 80:
            raise serializers.ValidationError("Years of experience must be between 0 and 80.")
        return value
