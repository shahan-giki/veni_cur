from django.contrib import adminfrom apps.payments.models import Payment@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order_id", "status", "amount", "created_at")
    list_filter = ("status",)
    search_fields = ("order_id", "reference_number", "proof_s3_key")
