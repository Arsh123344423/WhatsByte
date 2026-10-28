from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Patient

User = get_user_model()


class PatientAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="doctor.admin@hospital.com",
            name="Dr. Admin",
            password="AdminPassword123"
        )
        self.other_user = User.objects.create_user(
            email="other.user@hospital.com",
            name="Other Staff",
            password="OtherPassword123"
        )
        # Authenticate with primary user
        self.client.force_authenticate(user=self.user)

        self.patient_payload = {
            "name": "John Smith",
            "age": 45,
            "gender": "Male",
            "contact_number": "9876543210",
            "address": "123 Elm Street, Cityville",
            "medical_history": "Hypertension, Mild Asthma"
        }

    def test_unauthenticated_request_blocked(self):
        anonymous_client = APIClient()
        response = anonymous_client.get(reverse('patient_list_create'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_patient_success(self):
        response = self.client.post(reverse('patient_list_create'), self.patient_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['patient']['name'], self.patient_payload['name'])
        self.assertEqual(Patient.objects.count(), 1)
        patient = Patient.objects.first()
        self.assertEqual(patient.created_by, self.user)

    def test_get_patients_retrieves_only_created_by_user(self):
        # Create one patient by self.user
        Patient.objects.create(created_by=self.user, **self.patient_payload)

        # Create another patient by self.other_user
        Patient.objects.create(
            name="Other Patient",
            age=30,
            gender="Female",
            contact_number="1234567890",
            address="456 Oak Avenue",
            created_by=self.other_user
        )

        response = self.client.get(reverse('patient_list_create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify only the user's patient is returned
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.patient_payload['name'])

    def test_get_specific_patient_detail(self):
        patient = Patient.objects.create(created_by=self.user, **self.patient_payload)
        url = reverse('patient_detail', kwargs={'id': patient.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], patient.id)
        self.assertEqual(response.data['name'], patient.name)

    def test_update_patient(self):
        patient = Patient.objects.create(created_by=self.user, **self.patient_payload)
        url = reverse('patient_detail', kwargs={'id': patient.id})
        updated_data = {
            "name": "John Smith Updated",
            "age": 46,
            "gender": "Male",
            "contact_number": "9876543210",
            "address": "123 New Address, Cityville",
            "medical_history": "Hypertension resolved"
        }
        response = self.client.put(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        patient.refresh_from_db()
        self.assertEqual(patient.name, "John Smith Updated")
        self.assertEqual(patient.age, 46)

    def test_delete_patient(self):
        patient = Patient.objects.create(created_by=self.user, **self.patient_payload)
        url = reverse('patient_detail', kwargs={'id': patient.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Patient.objects.count(), 0)

    def test_invalid_patient_age(self):
        invalid_data = self.patient_payload.copy()
        invalid_data['age'] = -5
        response = self.client.post(reverse('patient_list_create'), invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
