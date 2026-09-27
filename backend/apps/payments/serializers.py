from rest_framework import serializersfrom apps.payments.models import Paymentclass CustomerPaymentStateSerializer(serializers.Serializer):
    can_upload_proof = serializers.BooleanField()
    status = serializers.CharField(allow_null=True)
    rejection_reason = serializers.CharField()
    reference_number = serializers.CharField()
    updated_at = serializers.DateTimeField(allow_null=True)


class PaymentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "status",
            "amount",
            "reference_number",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class PresignPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)
    file_type = serializers.CharField(max_length=128)
    file_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    byte_size = serializers.IntegerField(min_value=1)
    access_token = serializers.UUIDField(required=False, allow_null=True)


class ConfirmPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)
    s3_key = serializers.CharField(max_length=512)
    reference_number = serializers.CharField(
        max_length=64, required=False, allow_blank=True, default=""
    )
    access_token = serializers.UUIDField(required=False, allow_null=True)


class ManualPaymentInstructionsSerializer(serializers.Serializer):
    currency = serializers.CharField()
    bank_name = serializers.CharField()
    account_title = serializers.CharField()
    account_number = serializers.CharField()
    iban = serializers.CharField()
    instructions = serializers.CharField()


class RejectPaymentSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=2000)


class AdminProofUrlSerializer(serializers.Serializer):
    url = serializers.URLField()
    expires_in = serializers.IntegerField()
