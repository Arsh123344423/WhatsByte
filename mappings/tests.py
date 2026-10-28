from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from patients.models import Patient
from doctors.models import Doctor
from .models import PatientDoctorMapping

User = get_user_model()


class MappingAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="coordinator@hospital.com",
            name="Care Coordinator",
            password="SecurePassword123"
        )
        self.client.force_authenticate(user=self.user)

        self.patient = Patient.objects.create(
            name="Alice Walker",
            age=34,
            gender="Female",
            contact_number="9876543210",
            address="789 Pine Street",
            created_by=self.user
        )

        self.doctor = Doctor.objects.create(
            name="Meredith Grey",
            specialization="General Surgery",
            contact_number="9123456789",
            email="dr.grey@hospital.com",
            years_of_experience=10,
            created_by=self.user
        )

        self.doctor2 = Doctor.objects.create(
            name="Derek Shepherd",
            specialization="Neurosurgery",
            contact_number="9123456788",
            email="dr.shepherd@hospital.com",
            years_of_experience=14,
            created_by=self.user
        )

    def test_assign_doctor_to_patient_success(self):
        payload = {
            "patient_id": self.patient.id,
            "doctor_id": self.doctor.id,
            "notes": "Primary surgeon assigned"
        }
        response = self.client.post(reverse('mapping_list_create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PatientDoctorMapping.objects.count(), 1)
        mapping = PatientDoctorMapping.objects.first()
        self.assertEqual(mapping.patient, self.patient)
        self.assertEqual(mapping.doctor, self.doctor)
        self.assertEqual(mapping.assigned_by, self.user)

    def test_assign_doctor_alternate_keys(self):
        # Support passing 'patient' and 'doctor'
        payload = {
            "patient": self.patient.id,
            "doctor": self.doctor.id,
        }
        response = self.client.post(reverse('mapping_list_create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PatientDoctorMapping.objects.count(), 1)

    def test_prevent_duplicate_mapping(self):
        PatientDoctorMapping.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            assigned_by=self.user
        )
        payload = {
            "patient_id": self.patient.id,
            "doctor_id": self.doctor.id
        }
        response = self.client.post(reverse('mapping_list_create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_all_mappings(self):
        PatientDoctorMapping.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            assigned_by=self.user
        )
        PatientDoctorMapping.objects.create(
            patient=self.patient,
            doctor=self.doctor2,
            assigned_by=self.user
        )
        response = self.client.get(reverse('mapping_list_create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_doctors_assigned_to_specific_patient(self):
        PatientDoctorMapping.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            assigned_by=self.user
        )
        PatientDoctorMapping.objects.create(
            patient=self.patient,
            doctor=self.doctor2,
            assigned_by=self.user
        )

        url = reverse('mapping_detail', kwargs={'identifier': self.patient.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['patient_id'], self.patient.id)
        self.assertEqual(response.data['total_assigned_doctors'], 2)
        self.assertEqual(len(response.data['assigned_doctors']), 2)

    def test_remove_doctor_mapping_by_id(self):
        mapping = PatientDoctorMapping.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            assigned_by=self.user
        )
        url = reverse('mapping_detail', kwargs={'identifier': mapping.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PatientDoctorMapping.objects.count(), 0)

    def test_remove_doctor_mapping_nonexistent(self):
        url = reverse('mapping_detail', kwargs={'identifier': 99999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
