import re
from rest_framework import serializers
from .models import Patient
from accounts.serializers import UserSerializer


class PatientSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id',
            'name',
            'age',
            'gender',
            'contact_number',
            'address',
            'medical_history',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Patient name cannot be empty.")
        return value.strip()

    def validate_age(self, value):
        if value <= 0 or value > 150:
            raise serializers.ValidationError("Age must be a positive integer between 1 and 150.")
        return value

    def validate_gender(self, value):
        valid_genders = ['Male', 'Female', 'Other']
        if value.capitalize() not in valid_genders:
            raise serializers.ValidationError(f"Gender must be one of: {', '.join(valid_genders)}.")
        return value.capitalize()

    def validate_contact_number(self, value):
        value = value.strip()
        # Ensure it has digits and valid phone formatting
        digits = re.sub(r'\D', '', value)
        if len(digits) < 7 or len(digits) > 15:
            raise serializers.ValidationError("Contact number must contain between 7 and 15 digits.")
        return value

    def validate_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Address cannot be empty.")
        return value.strip()
