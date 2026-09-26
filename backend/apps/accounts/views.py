from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import (
    LoginSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    SafeUserSerializer,
)
from apps.accounts.services.auth_service import authenticate_email_password
from common.authentication import SessionAuthenticationWithCsrf

AUTH_INVALID_MESSAGE = "Invalid email or password."


class CsrfView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    @extend_schema(responses={200: OpenApiResponse(description="CSRF cookie set")})
    def get(self, request):
        return Response({"detail": "ok"})


class RegisterView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [AllowAny]

    @extend_schema(
        request=RegisterSerializer,
        responses={201: SafeUserSerializer},
    )
    def post(self, request):
        data = {**request.data}
        data.pop("role", None)
        serializer = RegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(SafeUserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: SafeUserSerializer},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        user = authenticate_email_password(email=email, password=password)
        if user is None:
            return Response(
                {"detail": AUTH_INVALID_MESSAGE},
                status=status.HTTP_400_BAD_REQUEST,
            )
        login(request, user)
        return Response(SafeUserSerializer(user).data)


class LogoutView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={204: OpenApiResponse(description="Session terminated")})
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses={200: PublicUserSerializer})
    def get(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        return Response(PublicUserSerializer(request.user).data)
