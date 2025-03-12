# from freezegun import freeze_time
import json
import uuid
from freezegun import freeze_time
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


@freeze_time("2024-01-05")
@pytest.mark.django_db
def test_set_scope_forecast():
    api_client = APIClient()

    boardid = boardid = addBoard().boardid
    column_id = addColumn(boardid, uuid.uuid4(), "Column 1").columnid
    ticket_id = addTicket(column_id, uuid.uuid4(), "Ticket", size=2).ticketid

    response = api_client.post(reverse("scopes_on_board", args=[boardid]), {"title": "test scope"})
    scope_id = response.json()["scopeid"]

    response = api_client.post(reverse("tickets_in_scope", args=[scope_id]), {"ticketid": ticket_id})
    assert response.status_code == 200

    response = api_client.post(reverse("set_scope_forecast", args=[scope_id]))
    assert response.status_code == 200

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))

    assert response.json()[0]["forecast_set_date"] == "2024-01-05T00:00:00Z"
    assert response.json()[0]["forecast_size"] == 2
    assert response.json()[0]["forecast_tickets"] == [{"ticketid": str(ticket_id), "size": 2}]

    response = api_client.delete(reverse("update_ticket", args=[column_id, ticket_id]))
    assert response.status_code == 200

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))

    assert response.json()[0]["forecast_set_date"] == "2024-01-05T00:00:00Z"
    assert response.json()[0]["forecast_size"] == 2
    assert response.json()[0]["forecast_tickets"] == []

    resetDB()


@pytest.mark.django_db
def test_set_scope_title():
    api_client = APIClient()

    boardid = boardid = addBoard().boardid

    response = api_client.post(reverse("scopes_on_board", args=[boardid]), {"title": "test scope"})
    scope_id = response.json()["scopeid"]

    response = api_client.post(reverse("set_scope_title", args=[scope_id]), {"title": "new test title"})
    assert response.status_code == 200

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))

    assert response.json()[0]["title"] == "new test title"

    resetDB()


@pytest.mark.django_db
def test_set_scope_done_columns():
    api_client = APIClient()

    boardid = boardid = addBoard().boardid
    column_id_1 = addColumn(boardid, uuid.uuid4(), "Column 1").columnid
    column_id_2 = addColumn(boardid, uuid.uuid4(), "Column 2").columnid

    response = api_client.post(reverse("scopes_on_board", args=[boardid]), {"title": "test scope"})
    scope_id = response.json()["scopeid"]

    response = api_client.post(
        reverse("set_scope_done_columns", args=[scope_id]),
        json.dumps({"done_columns": [str(column_id_1)]}),
        content_type="application/json",
    )
    assert response.status_code == 200

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    done_columns = response.json()[0]["done_columns"]
    assert len(done_columns) == 1
    assert done_columns[0]["columnid"] == str(column_id_1)
    assert done_columns[0]["title"] == "Column 1"

    response = api_client.post(
        reverse("set_scope_done_columns", args=[scope_id]),
        json.dumps({"done_columns": [str(column_id_1), str(column_id_2)]}),
        content_type="application/json",
    )
    assert response.status_code == 200

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    done_columns = response.json()[0]["done_columns"]

    assert len(done_columns) == 2
    # Order can vary, either one is fine
    assert done_columns[0]["columnid"] == str(column_id_1) or done_columns[1]["columnid"] == str(column_id_1)
    assert done_columns[0]["columnid"] == str(column_id_2) or done_columns[1]["columnid"] == str(column_id_2)

    response = api_client.post(
        reverse("set_scope_done_columns", args=[scope_id]),
        json.dumps({"done_columns": []}),
        content_type="application/json",
    )
    assert response.status_code == 200

    response = api_client.get(reverse("scopes_on_board", args=[boardid]))
    done_columns = response.json()[0]["done_columns"]
    assert len(done_columns) == 0

    resetDB()
