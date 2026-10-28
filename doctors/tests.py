from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Doctor

User = get_user_model()


class DoctorAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="admin@hospital.com",
            name="Hospital Admin",
            password="AdminPassword123"
        )
        self.client.force_authenticate(user=self.user)

        self.doctor_payload = {
            "name": "Gregory House",
            "specialization": "Diagnostic Medicine",
            "contact_number": "9123456789",
            "email": "dr.house@hospital.com",
            "years_of_experience": 15
        }

    def test_unauthenticated_access_blocked(self):
        anonymous_client = APIClient()
        response = anonymous_client.get(reverse('doctor_list_create'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_doctor_success(self):
        response = self.client.post(reverse('doctor_list_create'), self.doctor_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['doctor']['name'], self.doctor_payload['name'])
        self.assertEqual(Doctor.objects.count(), 1)
        doctor = Doctor.objects.first()
        self.assertEqual(doctor.created_by, self.user)

    def test_retrieve_all_doctors(self):
        Doctor.objects.create(created_by=self.user, **self.doctor_payload)
        Doctor.objects.create(
            name="James Wilson",
            specialization="Oncology",
            contact_number="9123456780",
            email="dr.wilson@hospital.com",
            years_of_experience=12,
            created_by=self.user
        )
        response = self.client.get(reverse('doctor_list_create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_specific_doctor_details(self):
        doctor = Doctor.objects.create(created_by=self.user, **self.doctor_payload)
        url = reverse('doctor_detail', kwargs={'id': doctor.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], doctor.id)
        self.assertEqual(response.data['name'], doctor.name)

    def test_update_doctor_details(self):
        doctor = Doctor.objects.create(created_by=self.user, **self.doctor_payload)
        url = reverse('doctor_detail', kwargs={'id': doctor.id})
        updated_data = {
            "name": "Gregory House, M.D.",
            "specialization": "Diagnostic Medicine & Nephrology",
            "contact_number": "9123456789",
            "email": "dr.house@hospital.com",
            "years_of_experience": 18
        }
        response = self.client.put(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doctor.refresh_from_db()
        self.assertEqual(doctor.name, "Gregory House, M.D.")
        self.assertEqual(doctor.years_of_experience, 18)

    def test_delete_doctor_record(self):
        doctor = Doctor.objects.create(created_by=self.user, **self.doctor_payload)
        url = reverse('doctor_detail', kwargs={'id': doctor.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Doctor.objects.count(), 0)

    def test_duplicate_doctor_email(self):
        Doctor.objects.create(created_by=self.user, **self.doctor_payload)
        response = self.client.post(reverse('doctor_list_create'), self.doctor_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
