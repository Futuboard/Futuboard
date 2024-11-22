from django.http import Http404
from rest_framework.decorators import api_view
from django.utils import timezone
from django.http import JsonResponse

from ..models import Board, Column, Swimlanecolumn, Action, Ticket, User
from ..serializers import SwimlaneColumnSerializer, ActionSerializer, UserSerializer


@api_view(["GET", "POST"])
def swimlanecolumns_on_column(request, column_id):
    if request.method == "GET":
        try:
            query_set = Swimlanecolumn.objects.filter(columnid=column_id).order_by("ordernum")
            serializer = SwimlaneColumnSerializer(query_set, many=True)
            return JsonResponse(serializer.data, safe=False)

        except Board.DoesNotExist:
            raise Http404("Error getting swimlane columns")

    if request.method == "POST":
        length = len(Swimlanecolumn.objects.filter(columnid=column_id))
        new_swimlanecolumn = Swimlanecolumn(
            swimlanecolumnid=request.data["swimlanecolumnid"],
            columnid=Column.objects.get(pk=column_id),
            title=request.data["title"],
            ordernum=length,
        )

        new_swimlanecolumn.save()
        serializer = SwimlaneColumnSerializer(new_swimlanecolumn)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET", "POST", "PUT"])
def action_on_swimlane(request, swimlanecolumn_id, ticket_id):
    if request.method == "PUT":
        actions_data = request.data

        # change action attributes to new swimlanecolumn and ticket
        for action in actions_data:
            action_from_database = Action.objects.get(actionid=action["actionid"])
            action_from_database.ticketid = Ticket.objects.get(pk=ticket_id)
            action_from_database.swimlanecolumnid = Swimlanecolumn.objects.get(pk=swimlanecolumn_id)
            action_from_database.save()

        # update order of actions
        for index, action_data in enumerate(actions_data):
            action = Action.objects.get(actionid=action_data["actionid"])
            action.order = index
            action.save()
        return JsonResponse({"message": "Action order updated successfully"}, status=200)

    if request.method == "GET":
        try:
            query_set = Action.objects.filter(swimlanecolumnid=swimlanecolumn_id, ticketid=ticket_id).order_by("order")
            serializer = ActionSerializer(query_set, many=True)
            return JsonResponse(serializer.data, safe=False)

        except Board.DoesNotExist:
            raise Http404("Error getting actions")

    if request.method == "POST":
        length = len(Action.objects.filter(ticketid=ticket_id))
        print(length)
        new_action = Action(
            actionid=request.data["actionid"],
            ticketid=Ticket.objects.get(pk=ticket_id),
            swimlanecolumnid=Swimlanecolumn.objects.get(pk=swimlanecolumn_id),
            title=request.data["title"],
            order=length,
            creation_date=timezone.now(),
        )
        new_action.save()

        serializer = ActionSerializer(new_action)
        return JsonResponse(serializer.data, safe=False)


@api_view(["PUT"])
def update_swimlanecolumn(request, swimlanecolumn_id):
    try:
        swimlanecolumn = Swimlanecolumn.objects.get(pk=swimlanecolumn_id)
    except Column.DoesNotExist:
        raise Http404("Column not found")

    if request.method == "PUT":
        swimlanecolumn.title = request.data.get("title", swimlanecolumn.title)
        swimlanecolumn.save()

        serializer = SwimlaneColumnSerializer(swimlanecolumn)
        return JsonResponse(serializer.data, safe=False)


@api_view(["PUT"])
def update_action(request, action_id):
    if request.method == "PUT":
        try:
            action = Action.objects.get(pk=action_id)
        except Ticket.DoesNotExist:
            raise Http404("Action not found")

        action.title = request.data.get("title", action.title)
        action.save()

        serializer = ActionSerializer(action)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET", "POST", "DELETE"])
def users_on_action(request, action_id):
    if request.method == "GET":
        try:
            users = User.objects.filter(actions__actionid=action_id)
            serializer = UserSerializer(users, many=True)
        except Board.DoesNotExist:
            raise Http404("Error getting users")
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        userid = request.data["userid"]
        user = User.objects.get(pk=userid)
        user.actions.add(action_id)
        return JsonResponse({"message": "Added user to action succesfully"}, status=200)

    if request.method == "DELETE":
        userid = request.data["userid"]
        user = User.objects.get(pk=userid)
        user.actions.remove(action_id)
        return JsonResponse({"message": "Removed user from action succesfully"}, status=200)
