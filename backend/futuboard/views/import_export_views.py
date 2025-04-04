"""
Views to import and export JSON files of board data
"""

from datetime import datetime
import uuid
from django.http import HttpResponse

from ..verification import check_if_access_token_incorrect, hash_password

from ..models import Action, Board, Column, Scope, Swimlanecolumn, Ticket, TicketEvent, User

from ..serializers import (
    BoardSerializer,
    ScopeSerializer,
    SwimlaneColumnSerializer,
    TicketSerializer,
    UserSerializer,
    ColumnSerializer,
    ActionSerializer,
    TicketEventSerializer,
)
from rest_framework.decorators import api_view
from django.http import JsonResponse
import json
from django.db import models


@api_view(["GET"])
def export_board_data(request, board_id):
    """
    Export board data to a json file
    """
    if request.method == "GET":
        if token_incorrect := check_if_access_token_incorrect(board_id, request):
            return token_incorrect
        data = create_data_dict_from_board(board_id)
        response = JsonResponse(data, safe=False)
        filename = data["board"]["title"].replace(" ", "-") + "-" + datetime.now().strftime("%d-%m-%Y")
        response["Content-Disposition"] = f'attachment; filename="{filename}.json"'

        return response
    return HttpResponse("Invalid request", status=400)


def create_data_dict_from_board(board_id):
    board = Board.objects.get(boardid=board_id)
    users = User.objects.filter(boardid=board_id)
    columns = Column.objects.filter(boardid=board_id)
    swimlanecolumns = Swimlanecolumn.objects.filter(columnid__in=columns)
    tickets = Ticket.objects.filter(columnid__in=columns)
    actions = Action.objects.filter(ticketid__in=tickets)
    ticketEvents = TicketEvent.objects.filter(ticketid__in=tickets)

    data = {}
    data["board"] = BoardSerializer(board).data
    data["users"] = UserSerializer(users, many=True).data
    data["columns"] = ColumnSerializer(columns, many=True).data
    data["swimlanecolumns"] = SwimlaneColumnSerializer(swimlanecolumns, many=True).data
    data["tickets"] = TicketSerializer(tickets, many=True).data
    data["actions"] = ActionSerializer(actions, many=True).data
    data["ticketEvents"] = TicketEventSerializer(ticketEvents, many=True).data
    data["scopes"] = ScopeSerializer(Scope.objects.filter(boardid=board_id), many=True).data

    return data


@api_view(["POST"])
def import_board_data(request):
    """
    Import board data from a json file
    """
    if request.method == "POST":
        json_file = request.FILES["file"]
        if not json_file.name.endswith(".json"):
            return HttpResponse("Invalid file type", status=400)
        json_string = json_file.read().decode("UTF-8")
        data = json.loads(json_string)

        board_metadata = json.loads(request.data["board"])
        title = board_metadata["title"]
        password = board_metadata["password"]

        created_board = create_board_from_data_dict(data, title, password)

        return JsonResponse(created_board, safe=False)

    return HttpResponse("Invalid request", status=400)


def create_board_from_data_dict(data, new_title, new_password):
    new_ids = {}

    for key in data:
        replace_ids(data, key, new_ids)

    board_data = data["board"]
    board_data["title"] = new_title
    board_data["passwordhash"] = hash_password(new_password)

    new_board = add_to_db(Board, board_data)

    for column in data["columns"]:
        add_to_db(Column, column)

    for swimlanecolumn in data["swimlanecolumns"]:
        add_to_db(Swimlanecolumn, swimlanecolumn)

    for ticket in data["tickets"]:
        add_to_db(Ticket, ticket)

    for action in data["actions"]:
        add_to_db(Action, action)

    for scope in data.get("scopes", []):
        add_to_db(Scope, scope)

    for ticketEvent in data["ticketEvents"]:
        add_to_db(TicketEvent, ticketEvent)

    for user in data["users"]:
        add_to_db(User, user)

    serializer = BoardSerializer(new_board)

    return serializer.data


def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False


# Recursively replace all UUIDs in a dictionary with new UUIDs
def replace_ids(data_dict, key, new_ids):
    value = data_dict[key]
    is_string = isinstance(value, str)
    if isinstance(value, uuid.UUID) or (is_string and is_valid_uuid(value)):
        value = str(value)
        if value in new_ids:
            data_dict[key] = new_ids[value]
        else:
            new_id = str(uuid.uuid4())
            new_ids[value] = new_id
            data_dict[key] = new_id

    elif isinstance(value, dict):
        for innerkey in value:
            replace_ids(value, innerkey, new_ids)

    elif isinstance(value, list):
        for i in range(len(value)):
            replace_ids(value, i, new_ids)


def add_to_db(model, data):
    fields = model._meta.get_fields()

    # Remove fields that are not in the model
    field_names = [f.name for f in fields]
    fields_to_remove = []  # Can't remove items from a dictionary while iterating over it
    for key in data:
        if key not in field_names:
            fields_to_remove.append(key)

    for key in fields_to_remove:
        del data[key]

    many_to_many_values = {}

    for field in fields:
        # Replace foreign keys with actual objects
        if isinstance(field, models.ForeignKey):
            if field.name in data and data[field.name]:
                data[field.name] = field.related_model.objects.get(pk=data[field.name])

        # Save data from many-to-many fields for later
        if isinstance(field, models.ManyToManyField):
            if field.name in data:
                many_to_many_values[field.name] = data[field.name]
                del data[field.name]

    new_object = model.objects.create(**data)

    # Add many-to-many values
    for field_name, values in many_to_many_values.items():
        for value in values:
            getattr(new_object, field_name).add(value)  # Same as user.tickets.add(ticket)

    return new_object
