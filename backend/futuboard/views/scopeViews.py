from rest_framework.decorators import api_view
from django.http import JsonResponse

from ..models import Board, Column, Scope, Ticket, TicketEvent
from ..serializers import ScopeSerializer
import rest_framework.request
from django.utils.timezone import now


@api_view(["GET", "POST", "DELETE"])
def scopes_on_board(request: rest_framework.request.Request, boardid: str):
    if request.method == "GET":
        board = Board.objects.get(boardid=boardid)
        query_set = Scope.objects.filter(boardid=board)
        serializer = ScopeSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        board = Board.objects.get(boardid=boardid)
        new_scope = Scope(
            boardid=board,
            title=request.data["title"],
        )
        new_scope.save()

        serializer = ScopeSerializer(new_scope)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "DELETE":
        scope = Scope.objects.get(scopeid=request.data["scopeid"])
        scope.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Invalid request method"}, status=400)


@api_view(["POST", "DELETE"])
def tickets_in_scope(request: rest_framework.request.Request, scopeid: str):
    if request.method == "POST":
        scope = Scope.objects.get(scopeid=scopeid)
        ticket = Ticket.objects.get(ticketid=request.data["ticketid"])

        ticket_add_to_scope_event = TicketEvent(
            ticketid=ticket,
            event_type=TicketEvent.CHANGE_SCOPE,
            old_columnid=ticket.columnid,
            new_columnid=ticket.columnid,
            old_size=ticket.size,
            new_size=ticket.size,
            title=ticket.title,
        )
        ticket_add_to_scope_event.save()

        ticket_scopes = list(ticket.scope_set.all())

        ticket_add_to_scope_event.old_scopes.set(ticket_scopes)

        scope.tickets.add(ticket)
        ticket_scopes.append(scope)

        ticket_add_to_scope_event.new_scopes.set(ticket_scopes)

        return JsonResponse({"success": True})

    if request.method == "DELETE":
        scope = Scope.objects.get(scopeid=scopeid)
        ticket = Ticket.objects.get(ticketid=request.data["ticketid"])

        ticket_remove_from_scope_event = TicketEvent(
            ticketid=ticket,
            event_type=TicketEvent.CHANGE_SCOPE,
            old_columnid=ticket.columnid,
            new_columnid=ticket.columnid,
            old_size=ticket.size,
            new_size=ticket.size,
            title=ticket.title,
        )
        ticket_remove_from_scope_event.save()

        ticket_scopes = list(ticket.scope_set.all())
        ticket_remove_from_scope_event.old_scopes.set(ticket_scopes)

        scope.tickets.remove(ticket)
        ticket_scopes.remove(scope)

        ticket_remove_from_scope_event.new_scopes.set(ticket_scopes)

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Invalid request method"}, status=400)


@api_view(["POST"])
def set_scope_forecast(request: rest_framework.request.Request, scopeid: str):
    scope = Scope.objects.get(scopeid=scopeid)
    scope.forecast_set_date = now()
    scope_size = 0
    for ticket in scope.tickets.all():
        scope_size += ticket.size
    scope.forecast_size = scope_size
    scope.forecast_tickets.set(scope.tickets.all())
    scope.save()
    return JsonResponse({"success": True})


@api_view(["POST"])
def set_scope_title(request: rest_framework.request.Request, scopeid: str):
    scope = Scope.objects.get(scopeid=scopeid)
    scope.title = request.data["title"]
    scope.save()
    return JsonResponse({"success": True})


@api_view(["POST"])
def set_scope_done_columns(request: rest_framework.request.Request, scopeid: str):
    scope = Scope.objects.get(scopeid=scopeid)
    columns = Column.objects.filter(columnid__in=request.data["done_columns"])
    scope.done_columns.set(columns)
    scope.save()
    return JsonResponse({"success": True})
