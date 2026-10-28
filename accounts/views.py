from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Register a new user with name, email, and password.
    Returns the created user and JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "User registered successfully.",
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    }
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                "status": "error",
                "message": "Registration failed. Please check the provided data.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Log in a user and return a JWT token.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            validated_data = serializer.validated_data
            user = validated_data['user']
            return Response(
                {
                    "message": "Login successful.",
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": validated_data['access'],
                        "refresh": validated_data['refresh'],
                    },
                    "token": validated_data['access'], # convenience field
                },
                status=status.HTTP_200_OK
            )
        return Response(
            {
                "status": "error",
                "message": "Login failed. Invalid credentials.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
