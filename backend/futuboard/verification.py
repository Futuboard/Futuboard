import os
from uuid import UUID
from argon2 import PasswordHasher
from django.http import JsonResponse
from django.utils import timezone
import jwt


def verify_password(password: str, hash: str):
    ph = PasswordHasher()
    try:
        ph.verify(hash, password)
        return True
    except:  # noqa: E722
        return False


def hash_password(password):
    ph = PasswordHasher()
    hash = ph.hash(password)
    return hash


def get_token_from_request(request):
    try:
        token = request.headers["Authorization"]
        token = token.split(" ")[1]
        return str(token)
    except KeyError:
        return None


JWT_SECRET = os.environ.get("JWT_SECRET")


def encode_token(board_id: UUID):
    if not JWT_SECRET:
        raise ValueError("JWT_SECRET not set")

    return jwt.encode(
        {"board_id": str(board_id), "exp": timezone.now() + timezone.timedelta(weeks=50)},
        JWT_SECRET,
        algorithm="HS256",
    )


def decode_token(token: str):
    if not JWT_SECRET:
        raise ValueError("JWT_SECRET not set")

    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def incorrect_access_token(board_id, request):
    try:
        token = get_token_from_request(request)
        if token is None:
            return JsonResponse({"message": "Access token missing"}, status=401)

        decoded_token = decode_token(token)

        if decoded_token["board_id"] != str(board_id):
            return JsonResponse({"message": "Access token to wrong board"}, status=405)
        return None

    except jwt.ExpiredSignatureError:
        return JsonResponse({"message": "Access token expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"message": "Access token invalid"}, status=401)
    except Exception:
        return JsonResponse({"message": "An unexpected error occurred"}, status=500)


ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")


def is_admin_password_correct(password: str):
    return ADMIN_PASSWORD == password
