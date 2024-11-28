from django.http import Http404
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from ..models import Board, Column, Ticket, User, Swimlanecolumn
from ..serializers import ColumnSerializer, TicketSerializer, UserSerializer
from django.utils import timezone


# Create your views here.
@api_view(["GET", "POST", "PUT"])
def columns_on_board(request, board_id):
    if request.method == "GET":
        try:
            query_set = Column.objects.filter(boardid=board_id).order_by("ordernum")
        except Board.DoesNotExist:
            raise Http404("Column does not exist")
        serializer = ColumnSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        length = len(Column.objects.filter(boardid=board_id))
        new_column = Column(
            columnid=request.data["columnid"],
            boardid=Board.objects.get(pk=board_id),
            description="",
            title=request.data["title"],
            ordernum=length,
            creation_date=timezone.now(),
            swimlane=request.data["swimlane"],
        )
        new_column.save()
        if request.data["swimlane"]:
            defaultSwimlaneNames = ["To Do", "Doing", "Verify", "Done"]
            for name in defaultSwimlaneNames:
                swimlanecolumn = Swimlanecolumn(
                    columnid=Column.objects.get(pk=request.data["columnid"]),
                    title=name,
                    ordernum=defaultSwimlaneNames.index(name),
                )
                print("SWIM: " + str(swimlanecolumn.swimlanecolumnid))
                swimlanecolumn.save()
        serializer = ColumnSerializer(new_column)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "PUT":
        columns_data = request.data
        for index, column_data in enumerate(columns_data):
            column = Column.objects.get(columnid=column_data["columnid"])
            column.ordernum = index
            column.save()
        return JsonResponse({"message": "Columns order updated successfully"}, status=200)


@api_view(["GET", "POST", "PUT"])
def tickets_on_column(request, board_id, column_id):
    if request.method == "PUT":
        try:
            tickets_data = request.data

            # if ticket has a columnid that is not the same as the columnid from the ticket in the database, change it
            for ticket in tickets_data:
                ticket_from_database = Ticket.objects.get(ticketid=ticket["ticketid"])
                if ticket_from_database.columnid != Column.objects.get(pk=column_id):
                    ticket_from_database.columnid = Column.objects.get(pk=column_id)
                    ticket_from_database.save()

            # update order of tickets
            for index, ticket_data in enumerate(tickets_data):
                task = Ticket.objects.get(ticketid=ticket_data["ticketid"])
                task.order = index
                task.save()

            return JsonResponse({"message": "Tasks order updated successfully"}, status=200)

        except Ticket.DoesNotExist:
            raise Http404("Task does not exist")

    if request.method == "POST":
        new_ticket = Ticket(
            ticketid=request.data["ticketid"],
            columnid=Column.objects.get(pk=column_id),
            title=request.data["title"],
            description=request.data["description"],
            color=request.data["color"] if "color" in request.data else "white",
            storypoints=8,
            size=int(request.data["size"]) if request.data["size"] else 0,
            order=0,
            creation_date=timezone.now(),
            cornernote=request.data["cornernote"] if "cornernote" in request.data else "",
        )

        new_ticket.save()
        same_column_tickets = Ticket.objects.filter(columnid=column_id)
        for ticket in same_column_tickets:
            ticket.order += 1
            ticket.save()

        serializer = TicketSerializer(new_ticket)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "GET":
        query_set = Ticket.objects.filter(columnid=column_id).order_by("order")
        serializer = TicketSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(["PUT", "DELETE"])
def update_ticket(request, column_id, ticket_id):
    try:
        ticket = Ticket.objects.get(pk=ticket_id, columnid=column_id)
    except Ticket.DoesNotExist:
        raise Http404("Ticket not found")

    if request.method == "DELETE":
        ticket.delete()
        return JsonResponse({"message": "Ticket deleted successfully"}, status=200)

    if request.method == "PUT":
        ticket.title = request.data.get("title", ticket.title)
        ticket.description = request.data.get("description", ticket.description)
        ticket.color = request.data.get("color", ticket.color)
        ticket.storypoints = request.data.get("storypoints", ticket.storypoints)
        ticket.size = request.data.get("size", ticket.size)
        ticket.cornernote = request.data.get("cornernote", ticket.cornernote)
        ticket.save()

        serializer = TicketSerializer(ticket)
        return JsonResponse(serializer.data, safe=False)


@api_view(["PUT", "DELETE"])
def update_column(request, board_id, column_id):
    try:
        column = Column.objects.get(pk=column_id, boardid=board_id)
    except Column.DoesNotExist:
        raise Http404("Column not found")

    if request.method == "DELETE":
        column.delete()
        return JsonResponse({"message": "Column deleted successfully"}, status=200)

    if request.method == "PUT":
        column.title = request.data.get("title", column.title)
        column.wip_limit = request.data.get("wip_limit", column.wip_limit)
        column.wip_limit_story = request.data.get("wip_limit_story", column.wip_limit_story)
        column.save()

        serializer = ColumnSerializer(column)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET", "POST"])
def users_on_board(request, board_id):
    if request.method == "GET":
        users = User.objects.filter(boardid=board_id)
        serializer = UserSerializer(users, many=True)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        board = Board.objects.get(pk=board_id)
        new_user = User(name=request.data["name"], boardid=board)
        new_user.save()
        serializer = UserSerializer(new_user)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET", "POST", "DELETE"])
def users_on_ticket(request, ticket_id):
    if request.method == "GET":
        users = User.objects.filter(tickets__ticketid=ticket_id)
        serializer = UserSerializer(users, many=True)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        userid = request.data["userid"]
        user = User.objects.get(pk=userid)
        user.tickets.add(ticket_id)
        return JsonResponse({"message": "User added to ticket successfully"}, status=200)

    if request.method == "DELETE":
        userid = request.data["userid"]
        user = User.objects.get(pk=userid)
        user.tickets.remove(ticket_id)
        return JsonResponse({"message": "Removed user from ticket succesfully"}, status=200)


@api_view(["DELETE"])
def update_user(request, user_id):
    if request.method == "DELETE":
        user = User.objects.get(pk=user_id)
        response = "Successfully deleted user: {}".format(user_id)
        user.delete()
        return HttpResponse(response)
