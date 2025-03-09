from rest_framework.decorators import api_view
from django.http import JsonResponse

from ..models import Board, Scope, Ticket, TicketEvent
from ..serializers import ScopeSerializer
import rest_framework.request


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

        old_scopes = ticket.scope_set.all()
        ticket_add_to_scope_event.old_scopes.set(old_scopes)

        scope.tickets.add(ticket)

        new_scopes = ticket.scope_set.all()
        ticket_add_to_scope_event.new_scopes.set(new_scopes)

        ticket_add_to_scope_event.save()

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

        old_scopes = ticket.scope_set.all()
        ticket_remove_from_scope_event.old_scopes.set(old_scopes)

        scope.tickets.remove(ticket)
        new_scopes = ticket.scope_set.all()
        ticket_remove_from_scope_event.new_scopes.set(new_scopes)

        ticket_remove_from_scope_event.save()

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Invalid request method"}, status=400)


# TODO add setting forecast_set_date
# TODO add setting done_columns
