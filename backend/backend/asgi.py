"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from futuboard.consumers import BoardConsumer

settings_module = "backend.deployment" if "WEBSITE_HOSTNAME" in os.environ else "backend.settings"
os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)

application = ProtocolTypeRouter(
    {"http": get_asgi_application(), "websocket": URLRouter([path("board/<uuid:board_id>", BoardConsumer.as_asgi())])}
)
