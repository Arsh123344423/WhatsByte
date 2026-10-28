from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'role', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
        style={'input_type': 'password'}
    )
    role = serializers.ChoiceField(
        choices=User.ROLE_CHOICES,
        default='patient',
        required=False
    )

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'role')
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'email': {'required': True, 'allow_blank': False},
        }

    def validate_email(self, value):
        normalized_email = value.lower().strip()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized_email

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'].strip(),
            password=validated_data['password'],
            role=validated_data.get('role', 'patient')
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = authenticate(
            request=self.context.get('request'),
            email=email,
            password=password
        )

        if not user:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )

        if not user:
            # Let's check if user exists to give helpful feedback or invalid credentials
            if not User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError("No account found with this email.")
            raise serializers.ValidationError("Invalid credentials provided. Please check your password.")

        if not user.is_active:
            raise serializers.ValidationError("This account is currently disabled.")

        refresh = RefreshToken.for_user(user)

        return {
            'user': user,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
