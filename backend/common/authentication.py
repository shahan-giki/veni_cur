from rest_framework.authentication import SessionAuthentication


class SessionAuthenticationWithCsrf(SessionAuthentication):
    """Session auth for SPA: enforce CSRF on unsafe requests even when anonymous."""

    def authenticate(self, request):
        if request.method not in ("GET", "HEAD", "OPTIONS", "TRACE"):
            self.enforce_csrf(request)
        return super().authenticate(request)
