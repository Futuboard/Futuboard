from rest_framework.decorators import api_view
from django.http import JsonResponse

from ..models import Board, Scope, Ticket, TicketEvent
from ..serializers import ScopeSerializer
import rest_framework.request


@api_view(["GET", "POST", "DELETE"])
def scopes(request: rest_framework.request.Request):
    if request.method == "GET":
        query_set = Scope.objects.all()
        serializer = ScopeSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        board = Board.objects.get(boardid=request.data["boardid"])
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
        old_scopes = ticket.scope_set.all()
        scope.tickets.add(ticket)
        new_scopes = ticket.scope_set.all()

        ticket_move_event = TicketEvent(
            ticketid=ticket,
            event_type=TicketEvent.CHANGE_SCOPE,
            old_columnid=ticket.columnid,
            new_columnid=ticket.columnid,
            old_size=ticket.size,
            new_size=ticket.size,
            title=ticket.title,
            old_scopes=old_scopes,
            new_scopes=new_scopes,
        )
        ticket_move_event.save()

        return JsonResponse({"success": True})

    if request.method == "DELETE":
        scope = Scope.objects.get(scopeid=scopeid)
        ticket = Ticket.objects.get(ticketid=request.data["ticketid"])
        old_scopes = ticket.scope_set.all()
        scope.tickets.remove(ticket)
        new_scopes = ticket.scope_set.all()

        ticket_move_event = TicketEvent(
            ticketid=ticket,
            event_type=TicketEvent.CHANGE_SCOPE,
            old_columnid=ticket.columnid,
            new_columnid=ticket.columnid,
            old_size=ticket.size,
            new_size=ticket.size,
            title=ticket.title,
            old_scopes=old_scopes,
            new_scopes=new_scopes,
        )
        ticket_move_event.save()

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Invalid request method"}, status=400)
