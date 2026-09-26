from django.urls import path

from apps.payments.views import (
    AdminPaymentProofView,
    AdminPaymentRejectView,
    AdminPaymentVerifyView,
    ManualPaymentInstructionsView,
    PaymentConfirmView,
    PaymentPresignView,
)

urlpatterns = [
    path(
        "payments/instructions/",
        ManualPaymentInstructionsView.as_view(),
        name="payment-instructions",
    ),
    path(
        "payments/presign/",
        PaymentPresignView.as_view(),
        name="payment-presign",
    ),
    path(
        "payments/confirm/",
        PaymentConfirmView.as_view(),
        name="payment-confirm",
    ),
    path(
        "admin/payments/<int:pk>/verify/",
        AdminPaymentVerifyView.as_view(),
        name="admin-payment-verify",
    ),
    path(
        "admin/payments/<int:pk>/reject/",
        AdminPaymentRejectView.as_view(),
        name="admin-payment-reject",
    ),
    path(
        "admin/payments/<int:pk>/proof/",
        AdminPaymentProofView.as_view(),
        name="admin-payment-proof",
    ),
]
