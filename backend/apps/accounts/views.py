from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    SafeUserSerializer,
)
from apps.accounts.services.auth_service import (
    authenticate_email_password,
    register_customer,
)
from apps.accounts.services.password_service import (
    change_password,
    confirm_password_reset,
    request_password_reset,
)
from apps.cart.services.cart_service import merge_session_cart_into_user
from common.authentication import SessionAuthenticationWithCsrf

AUTH_INVALID_MESSAGE = "Invalid email or password."
RESET_GENERIC = (
    "If an account exists for that email, password reset instructions were sent."
)


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
    throttle_scope = "auth"

    @extend_schema(
        request=RegisterSerializer,
        responses={201: SafeUserSerializer},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = register_customer(**serializer.validated_data)
        return Response(SafeUserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [AllowAny]
    throttle_scope = "auth"

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
        guest_session_key = request.session.session_key
        login(request, user)
        if getattr(user, "role", None) == UserRole.CUSTOMER:
            merge_session_cart_into_user(user=user, session_key=guest_session_key)
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


class PasswordResetRequestView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    @extend_schema(request=PasswordResetRequestSerializer, responses={200: OpenApiResponse()})
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        origin = request.headers.get("Origin") or request.build_absolute_uri("/").rstrip("/")
        template = f"{origin}/reset-password/{{uid}}/{{token}}"
        request_password_reset(
            email=serializer.validated_data["email"],
            reset_path_template=template,
        )
        return Response({"detail": RESET_GENERIC})


class PasswordResetConfirmView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    @extend_schema(request=PasswordResetConfirmSerializer, responses={200: OpenApiResponse()})
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        confirm_password_reset(
            uid=data["uid"],
            token=data["token"],
            new_password=data["new_password"],
        )
        return Response({"detail": "Password updated. You can sign in."})


class PasswordChangeView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated]
    throttle_scope = "auth"

    @extend_schema(request=PasswordChangeSerializer, responses={200: OpenApiResponse()})
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        change_password(
            user=request.user,
            current_password=serializer.validated_data["current_password"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response({"detail": "Password updated."})

