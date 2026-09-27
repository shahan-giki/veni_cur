from rest_framework.test import APIClient

CHECKOUT_CONTACT = {
    "name": "Ayesha Khan",
    "phone": "+92 300 1234567",
    "email": "ayesha@example.test",
    "address": "12 Jinnah Road",
    "city": "Lahore",
}


def csrf_headers(client: APIClient) -> dict[str, str]:
    client.get("/api/v1/auth/csrf/")
    token = client.cookies.get("csrftoken")
    assert token is not None
    return {"HTTP_X_CSRFTOKEN": token.value}
