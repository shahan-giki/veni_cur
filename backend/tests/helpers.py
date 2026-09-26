from rest_framework.test import APIClient


def csrf_headers(client: APIClient) -> dict[str, str]:
    client.get("/api/v1/auth/csrf/")
    token = client.cookies.get("csrftoken")
    assert token is not None
    return {"HTTP_X_CSRFTOKEN": token.value}
