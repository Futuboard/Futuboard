from uuid import UUID
from argon2 import PasswordHasher
import argon2
from django.http import Http404, JsonResponse
from django.utils import timezone
import jwt
from decouple import config

from futuboard.models import Action, Board, Column, Swimlanecolumn, Ticket
from django.conf import settings

ph = PasswordHasher()


def verify_password(password: str, hash: str):
    try:
        ph.verify(hash, password)
        return True
    except argon2.exceptions.VerificationError:
        return False


def hash_password(password):
    hash = ph.hash(password)
    return hash


def get_token_from_request(request):
    try:
        token = request.headers["Authorization"]
        token = token.split(" ")[1]
        return str(token)
    except KeyError:
        return None


JWT_SECRET = config("JWT_SECRET")


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


def check_if_access_token_incorrect(board_id, request):
    # Check if the token checking is disabled in settings, this can be done for testing purposes
    if hasattr(settings, "DISABLE_AUTH_TOKEN_CHECKING") and settings.DISABLE_AUTH_TOKEN_CHECKING:
        return None

    board = Board.objects.get(boardid=board_id)

    if check_if_password_hash_is_empty(board.passwordhash):
        # If the board has no password, we don't need to check the token
        return None

    try:
        token = get_token_from_request(request)
        if token is None:
            return JsonResponse({"message": "Access token missing"}, status=401)

        decoded_token = decode_token(token)

        if decoded_token["board_id"] != str(board_id):
            return JsonResponse({"message": "Access token to wrong board"}, status=405)

        # Token is valid, return None to indicate no error
        return None

    except jwt.ExpiredSignatureError:
        return JsonResponse({"message": "Access token expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"message": "Access token invalid"}, status=401)
    except Board.DoesNotExist:
        return JsonResponse({"message": "Associated board not found"}, status=404)


def check_if_password_hash_is_empty(password_hash: str):
    return verify_password("", password_hash)


# model type is type[Column] | type[Scope] | type[Ticket] | type[Swimlanecolumn] | type[Action] | type[User]
def check_if_acces_token_incorrect_using_other_id(model, id, request):
    try:
        item = model.objects.get(pk=id)

        # Ticket and Swimlanecolumns don't have boardid, so we need to get it from their parent column
        if model is Ticket or model is Swimlanecolumn:
            return check_if_acces_token_incorrect_using_other_id(Column, item.columnid.columnid, request)

        # Action doesn't have boardid, so we need to get it from it's parent ticket
        if model is Action:
            return check_if_acces_token_incorrect_using_other_id(Ticket, item.ticketid.ticketid, request)

        # If User, Scope or Column, we can get the boardid directly from the item
        board_id = item.boardid.boardid
        if token_incorrect := check_if_access_token_incorrect(board_id, request):
            return token_incorrect

    except model.DoesNotExist:
        raise Http404(f"{model.__name__} not found")


ADMIN_PASSWORD = config("ADMIN_PASSWORD")


def is_admin_password_correct(password: str):
    return ADMIN_PASSWORD == password
