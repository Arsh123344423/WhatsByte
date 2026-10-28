from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')
        self.valid_user_data = {
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "password": "SecurePassword123!"
        }

    def test_register_user_success(self):
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], self.valid_user_data['email'].lower())
        self.assertTrue(User.objects.filter(email=self.valid_user_data['email'].lower()).exists())

    def test_register_duplicate_email(self):
        self.client.post(self.register_url, self.valid_user_data, format='json')
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_data(self):
        response = self.client.post(self.register_url, {"email": "invalid"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        # Register user first
        User.objects.create_user(
            email="testuser@example.com",
            name="Test User",
            password="StrongPassword123"
        )
        login_data = {
            "email": "testuser@example.com",
            "password": "StrongPassword123"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('token', response.data)

    def test_login_invalid_password(self):
        User.objects.create_user(
            email="testuser@example.com",
            name="Test User",
            password="StrongPassword123"
        )
        login_data = {
            "email": "testuser@example.com",
            "password": "WrongPassword"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_user(self):
        login_data = {
            "email": "ghost@example.com",
            "password": "AnyPassword123"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
