from rest_framework.decorators import api_view
from django.http import JsonResponse

from ..verification import check_if_access_token_incorrect

from ..models import Board, Column, Scope, Ticket, TicketEvent
from ..serializers import ScopeSerializerWithRelationInfo
import rest_framework.request
from django.utils.timezone import now
from django.core.cache import cache


@api_view(["GET", "POST", "DELETE"])
def scopes_on_board(request: rest_framework.request.Request, board_id: str):
    if request.method == "GET":
        cache_key = f"scopes_{board_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return JsonResponse(cached_data, safe=False)

        board = Board.objects.get(boardid=board_id)
        query_set = Scope.objects.filter(boardid=board)
        serializer = ScopeSerializerWithRelationInfo(query_set, many=True)
        cache.set(cache_key, serializer.data)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        if token_incorrect := check_if_access_token_incorrect(board_id, request):
            return token_incorrect
        board = Board.objects.get(boardid=board_id)
        new_scope = Scope(
            boardid=board,
            title=request.data["title"],
        )
        new_scope.save()
        cache.delete(f"scopes_{board_id}")
        serializer = ScopeSerializerWithRelationInfo(new_scope)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "DELETE":
        if token_incorrect := check_if_access_token_incorrect(board_id, request):
            return token_incorrect
        scope = Scope.objects.get(scopeid=request.data["scopeid"])
        scope.delete()
        cache.delete(f"scopes_{board_id}")

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Invalid request method"}, status=400)


@api_view(["POST", "DELETE"])
def tickets_in_scope(request: rest_framework.request.Request, scopeid: str):
    scope = Scope.objects.get(scopeid=scopeid)

    board_id = scope.boardid.boardid
    if token_incorrect := check_if_access_token_incorrect(board_id, request):
        return token_incorrect

    ticket = Ticket.objects.get(ticketid=request.data["ticketid"])

    if request.method == "POST":
        ticket_add_to_scope_event = TicketEvent(
            ticketid=ticket,
            event_type=TicketEvent.SCOPE_CHANGE,
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
        cache.delete_many([f"tickets_{ticket.columnid.columnid}", f"scopes_{board_id}"])
        return JsonResponse({"success": True})

    if request.method == "DELETE":
        ticket_remove_from_scope_event = TicketEvent(
            ticketid=ticket,
            event_type=TicketEvent.SCOPE_CHANGE,
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
        cache.delete_many([f"tickets_{ticket.columnid.columnid}", f"scopes_{board_id}"])

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Invalid request method"}, status=400)


@api_view(["POST"])
def set_scope_forecast(request: rest_framework.request.Request, scopeid: str):
    scope = Scope.objects.get(scopeid=scopeid)

    board_id = scope.boardid.boardid
    if token_incorrect := check_if_access_token_incorrect(board_id, request):
        return token_incorrect

    scope.forecast_set_date = now()
    scope_size = 0
    for ticket in scope.tickets.all():
        scope_size += ticket.size
    scope.forecast_size = scope_size
    scope.forecast_tickets.set(scope.tickets.all())
    scope.save()
    cache.delete(f"scopes_{board_id}")

    return JsonResponse({"success": True})


@api_view(["POST"])
def set_scope_title(request: rest_framework.request.Request, scopeid: str):
    scope = Scope.objects.get(scopeid=scopeid)

    board_id = scope.boardid.boardid
    if token_incorrect := check_if_access_token_incorrect(board_id, request):
        return token_incorrect

    scope.title = request.data["title"]
    scope.save()
    cache.delete(f"scopes_{board_id}")

    return JsonResponse({"success": True})


@api_view(["POST"])
def set_scope_done_columns(request: rest_framework.request.Request, scopeid: str):
    scope = Scope.objects.get(scopeid=scopeid)

    board_id = scope.boardid.boardid
    if token_incorrect := check_if_access_token_incorrect(board_id, request):
        return token_incorrect

    columns = Column.objects.filter(columnid__in=request.data["done_columns"])
    scope.done_columns.set(columns)
    scope.save()
    cache.delete(f"scopes_{board_id}")

    return JsonResponse({"success": True})
