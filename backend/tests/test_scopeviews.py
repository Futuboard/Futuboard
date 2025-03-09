# from freezegun import freeze_time
import uuid
import pytest
from rest_framework.test import APIClient
from django.urls import reverse

from futuboard.serializers import TicketEventSerializer
from futuboard.models import TicketEvent
from .test_utils import addBoard, addColumn, addTicket, resetDB


@pytest.mark.django_db
def test_get_and_create_scopes_on_board():
    api_client = APIClient()

    boardid = boardid = addBoard().boardid

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    assert response.status_code == 200
    assert response.json() == []

    post_response = api_client.post(reverse("scopes_on_board", args=[boardid]), {"title": "test scope"})
    assert post_response.status_code == 200
    post_data = post_response.json()

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0] == {
        "boardid": str(boardid),
        "scopeid": post_data["scopeid"],
        "title": "test scope",
        "creation_date": post_data["creation_date"],
        "forecast_set_date": None,
        "done_columns": [],
        "tickets": [],
    }

    resetDB()


@pytest.mark.django_db
def test_delete_scopes_on_board():
    api_client = APIClient()

    boardid = boardid = addBoard().boardid

    post_response = api_client.post(reverse("scopes_on_board", args=[boardid]), {"title": "test scope"})
    assert post_response.status_code == 200
    post_data = post_response.json()

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    assert response.status_code == 200
    assert len(response.json()) == 1

    delete_response = api_client.delete(reverse("scopes_on_board", args=[boardid]), {"scopeid": post_data["scopeid"]})
    assert delete_response.status_code == 200

    assert delete_response.json() == {"success": True}

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    assert response.status_code == 200
    assert len(response.json()) == 0

    resetDB()


@pytest.mark.django_db
def test_add_ticket_to_scope():
    api_client = APIClient()

    boardid = boardid = addBoard().boardid
    column_id = addColumn(boardid, uuid.uuid4(), "Column 1").columnid
    ticket_id = addTicket(column_id, uuid.uuid4(), "Ticket 1", size=3).ticketid

    scope_post_response = api_client.post(reverse("scopes_on_board", args=[boardid]), {"title": "test scope"})
    assert scope_post_response.status_code == 200

    scope_data = scope_post_response.json()

    response = api_client.post(reverse("tickets_in_scope", args=[scope_data["scopeid"]]), {"ticketid": ticket_id})
    assert response.status_code == 200
    assert response.json() == {"success": True}

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    assert response.status_code == 200
    assert len(response.json()) == 1

    data = response.json()

    assert data[0]["tickets"] == [{"ticketid": str(ticket_id), "size": 3}]

    ticket_change_event = TicketEvent.objects.get(ticketid=ticket_id)
    serializer = TicketEventSerializer(ticket_change_event)
    change_event_data = serializer.data

    assert change_event_data["event_type"] == "SCOPE"
    assert change_event_data["old_columnid"] == column_id
    assert change_event_data["new_columnid"] == column_id
    assert change_event_data["old_size"] == 3
    assert change_event_data["new_size"] == 3
    assert change_event_data["old_scopes"] == []
    assert change_event_data["new_scopes"] == [uuid.UUID(scope_data["scopeid"])]
    assert change_event_data["title"] == "Ticket 1"

    response = api_client.get(reverse("tickets_on_column", args=[boardid, column_id]))
    assert response.status_code == 200
    assert len(response.json()) == 1

    assert response.json()[0]["scopes"] == [{"scopeid": scope_data["scopeid"], "title": "test scope"}]

    resetDB()


@pytest.mark.django_db
def test_delete_ticket_from_scope():
    api_client = APIClient()

    boardid = boardid = addBoard().boardid
    column_id = addColumn(boardid, uuid.uuid4(), "Column 1").columnid
    ticket_id = addTicket(column_id, uuid.uuid4(), "Ticket 1", size=3).ticketid

    scope_post_response = api_client.post(reverse("scopes_on_board", args=[boardid]), {"title": "test scope"})
    assert scope_post_response.status_code == 200

    scope_data = scope_post_response.json()

    response = api_client.post(reverse("tickets_in_scope", args=[scope_data["scopeid"]]), {"ticketid": ticket_id})
    assert response.status_code == 200
    assert response.json() == {"success": True}

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    assert response.status_code == 200
    assert len(response.json()) == 1

    data = response.json()

    response = api_client.delete(reverse("tickets_in_scope", args=[scope_data["scopeid"]]), {"ticketid": ticket_id})
    assert response.status_code == 200
    assert response.json() == {"success": True}

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    assert response.status_code == 200
    assert len(response.json()) == 1

    data = response.json()

    assert data[0]["tickets"] == []

    ticket_change_events = TicketEvent.objects.filter(ticketid=ticket_id)
    serializer = TicketEventSerializer(ticket_change_events, many=True)
    change_events_data = serializer.data

    assert len(change_events_data) == 2
    assert change_events_data[1]["event_type"] == "SCOPE"
    assert change_events_data[1]["old_columnid"] == column_id
    assert change_events_data[1]["new_columnid"] == column_id
    assert change_events_data[1]["old_size"] == 3
    assert change_events_data[1]["new_size"] == 3
    assert change_events_data[1]["old_scopes"] == [uuid.UUID(scope_data["scopeid"])]
    assert change_events_data[1]["new_scopes"] == []
    assert change_events_data[1]["title"] == "Ticket 1"

    response = api_client.get(reverse("tickets_on_column", args=[boardid, column_id]))
    assert response.status_code == 200
    assert len(response.json()) == 1

    assert response.json()[0]["scopes"] == []

    resetDB()
