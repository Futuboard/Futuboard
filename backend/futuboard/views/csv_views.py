"""
Views to import and export CSV files of board data
"""

from datetime import datetime
import uuid
from django.http import HttpResponse

from ..models import Action, Board, Column, Swimlanecolumn, Ticket, TicketEvent, User

from ..serializers import (
    BoardSerializer,
    SwimlaneColumnSerializer,
    TicketSerializer,
    UserSerializer,
    ColumnSerializer,
    ActionSerializer,
    TicketEventSerializer,
)
from ..csv_parser import write_csv_header, write_board_data, verify_csv_header, read_board_data
import csv
import io
from rest_framework.decorators import api_view
from ..verification import hash_password
from django.http import JsonResponse
import json
from django.db import models


@api_view(["GET"])
def export_board_data(request, board_id, filename):
    """
    Export board data to a csv file
    """
    if request.method == "GET":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '.csv"'
        writer = csv.writer(response)
        write_csv_header(writer)
        write_board_data(writer, board_id)
        print("Board data exported")
        return response
    return HttpResponse("Invalid request")


@api_view(["POST"])
def import_board_data(request):
    """
    Import board data from a csv file
    """
    if request.method == "POST":
        print(request.data)
        csv_file = request.FILES["file"]
        print(csv_file)
        if not csv_file.name.endswith(".csv"):
            return HttpResponse("Invalid file type", status=400)
        data_set = csv_file.read().decode("UTF-8")
        io_string = io.StringIO(data_set)
        reader = csv.reader(io_string, delimiter=",", quotechar='"')
        if not verify_csv_header(reader):
            return HttpResponse("Invalid file header", status=400)
        board_data = json.loads(request.data["board"])
        board = read_board_data(reader, board_data["title"], hash_password(board_data["password"]))
        serializer = BoardSerializer(board)
        return JsonResponse(serializer.data, safe=False)

    return HttpResponse("Invalid request", status=400)


def export_board_data_json(request, board_id):
    board = Board.objects.get(boardid=board_id)
    users = User.objects.filter(boardid=board_id)
    columns = Column.objects.filter(boardid=board_id)
    swimlanecolumns = Swimlanecolumn.objects.filter(columnid__in=columns)
    tickets = Ticket.objects.filter(columnid__in=columns)
    actions = Action.objects.filter(ticketid__in=tickets)
    ticketEvents = TicketEvent.objects.filter(ticketid__in=tickets)

    json_data = {}
    json_data["board"] = BoardSerializer(board).data
    json_data["users"] = UserSerializer(users, many=True).data
    json_data["columns"] = ColumnSerializer(columns, many=True).data
    json_data["swimlanecolumns"] = SwimlaneColumnSerializer(swimlanecolumns, many=True).data
    json_data["tickets"] = TicketSerializer(tickets, many=True).data
    json_data["actions"] = ActionSerializer(actions, many=True).data
    json_data["ticketEvents"] = TicketEventSerializer(ticketEvents, many=True).data

    response = JsonResponse(json_data, safe=False)
    filename = board.title + "-" + datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    response["Content-Disposition"] = 'attachment; filename="' + filename + '.json"'

    return response


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
    if is_string and is_valid_uuid(value):
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


def create(model, data):
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


@api_view(["POST"])
def import_board_data_json(request):
    data = dict(request.data)
    new_ids = {}

    for key in data:
        replace_ids(data, key, new_ids)

    new_board = create(Board, data["board"])

    for column in data["columns"]:
        create(Column, column)

    for swimlanecolumn in data["swimlanecolumns"]:
        create(Swimlanecolumn, swimlanecolumn)

    for ticket in data["tickets"]:
        create(Ticket, ticket)

    for action in data["actions"]:
        create(Action, action)

    for ticketEvent in data["ticketEvents"]:
        create(TicketEvent, ticketEvent)

    for user in data["users"]:
        create(User, user)

    serializer = BoardSerializer(new_board)
    return JsonResponse(serializer.data, safe=False)
