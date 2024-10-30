from argon2 import PasswordHasher
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
import rest_framework.request


def logUserIn(request: rest_framework.request.Request):
    if request.method == "POST":
        board_id = request.POST["id"]
        password = request.POST["password"]
        # Verify password
        if verify_password(password, board_id):
            # Give access to board
            user = authenticate(request, username=board_id, password=password)
        else:
            return JsonResponse({"error": "Invalid login credentials"})
        if user is not None:
            login(request, user)
            # Generate and return an auth token
            """
            For later:
                token = Token.objects.create(user=user)
                return JsonResponse({'token': token.key})
            """
        else:
            # Return an 'invalid login' error message
            return JsonResponse({"error": "Invalid login credentials"})
    else:
        return JsonResponse({"error": "Invalid request method"})


def verify_password(password, id, hash: str):
    ph = PasswordHasher()
    # Get hash from database for board id
    try:
        ph.verify(hash, password)
        return True
    except:
        return False


def new_password(password):
    ph = PasswordHasher()
    hash = ph.hash(password)
    return hash


# Planning to use argon2 for hashing passwords with django hashers
# hashers.make_password('password', hasher='argon2')

# hashers.Argon2PasswordHasher.verify('password', encoded)
