from uuid import UUID
from argon2 import PasswordHasher
from django.utils import timezone
import jwt


def verify_password(password: str, hash: str):
    ph = PasswordHasher()
    try:
        ph.verify(hash, password)
        return True
    except:  # noqa: E722
        return False


def new_password(password):
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


JWT_SECRET = "secret"


def encode_token(board_id: UUID):
    return jwt.encode(
        {"board_id": str(board_id), "exp": timezone.now() + timezone.timedelta(weeks=50)},
        JWT_SECRET,
        algorithm="HS256",
    )


def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms="HS256")
