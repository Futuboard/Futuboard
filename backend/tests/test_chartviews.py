from datetime import datetime
import json
import uuid
from freezegun import freeze_time
import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from .test_utils import addBoard, addColumn, resetDB


def create_board_and_columns():
    boardid = addBoard().boardid
    column_id_1 = addColumn(boardid, uuid.uuid4(), "Column 1").columnid
    column_id_2 = addColumn(boardid, uuid.uuid4(), "Column 2").columnid
    return boardid, column_id_1, column_id_2


def create_ticket_at_time(boardid, column_id, creation_time, title="test ticket", size=5):
    api_client = APIClient()

    ticket = {
        "ticketid": str(uuid.uuid4()),
        "title": title,
        "description": "test description",
        "size": size,
    }

    freezer = freeze_time(creation_time)
    freezer.start()
    response = api_client.post(
        reverse("tickets_on_column", args=[boardid, column_id]),
        data=json.dumps(ticket),
        content_type="application/json",
    )
    freezer.stop()

    data = response.json()

    return data


def move_ticket_at_time(boardid, column_id, move_time, ticketid):
    api_client = APIClient()

    freezer = freeze_time(move_time)
    freezer.start()
    response = api_client.put(
        reverse("tickets_on_column", args=[boardid, column_id]),
        data=json.dumps([{"ticketid": ticketid}]),
        content_type="application/json",
    )
    freezer.stop()

    data = response.json()

    return data


def edit_ticket_at_time(column_id, edit_time, new_ticket):
    api_client = APIClient()

    freezer = freeze_time(edit_time)
    freezer.start()
    response = api_client.put(
        reverse("update_ticket", args=[column_id, new_ticket["ticketid"]]),
        data=json.dumps(new_ticket),
        content_type="application/json",
    )
    freezer.stop()

    data = response.json()

    return data


def delete_ticket_at_time(column_id, edit_time, ticket_id):
    api_client = APIClient()

    freezer = freeze_time(edit_time)
    freezer.start()
    response = api_client.delete(
        reverse("update_ticket", args=[column_id, ticket_id]),
        content_type="application/json",
    )
    freezer.stop()

    data = response.json()

    return data


def create_board_with_events():
    boardid, column_id, column_id_2 = create_board_and_columns()

    creation_time_1 = datetime(2024, 1, 1)
    ticket_1 = create_ticket_at_time(boardid, column_id, creation_time_1)

    creation_time_2 = datetime(2024, 1, 2)
    create_ticket_at_time(boardid, column_id_2, creation_time_2)

    move_time = datetime(2024, 1, 2)
    move_ticket_at_time(boardid, column_id_2, move_time, ticket_1["ticketid"])

    edit_time = datetime(2024, 1, 3)
    new_ticket = ticket_1.copy()
    new_ticket["title"] = "edited test ticket"
    new_ticket["size"] = 10
    edit_ticket_at_time(column_id_2, edit_time, new_ticket)

    delete_time = datetime(2024, 1, 4)
    delete_ticket_at_time(column_id_2, delete_time, ticket_1["ticketid"])

    return boardid


@pytest.mark.django_db
def test_ticket_create_event():
    """
    Test that correct events are returned for ticket creation
    """
    api_client = APIClient()

    boardid, column_id, _ = create_board_and_columns()

    creation_time = datetime(2024, 1, 1)
    ticket = create_ticket_at_time(boardid, column_id, creation_time)

    response = api_client.get(reverse("events", args=[boardid]))
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0] == {
        "ticketeventid": data[0]["ticketeventid"],
        "ticketid": ticket["ticketid"],
        "event_time": creation_time.isoformat() + "Z",
        "event_type": "CREATE",
        "old_columnid": None,
        "new_columnid": str(column_id),
        "old_size": 0,
        "new_size": 5,
        "title": "test ticket",
    }

    resetDB()


@pytest.mark.django_db
def test_ticket_move_event():
    """
    Test that correct events are returned for ticket move
    """
    api_client = APIClient()

    boardid, column_id_1, column_id_2 = create_board_and_columns()

    creation_time = datetime(2024, 1, 1)
    ticket = create_ticket_at_time(boardid, column_id_1, creation_time)

    move_time = datetime(2024, 1, 2)
    move_ticket_at_time(boardid, column_id_2, move_time, ticket["ticketid"])

    response = api_client.get(reverse("events", args=[boardid]))
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[1] == {
        "ticketeventid": data[1]["ticketeventid"],
        "ticketid": ticket["ticketid"],
        "event_time": move_time.isoformat() + "Z",
        "event_type": "MOVE",
        "old_columnid": str(column_id_1),
        "new_columnid": str(column_id_2),
        "old_size": 5,
        "new_size": 5,
        "title": "test ticket",
    }

    resetDB()


@pytest.mark.django_db
def test_ticket_edit_event():
    """
    Test that correct events are returned for ticket edit
    """
    api_client = APIClient()

    boardid, column_id, _ = create_board_and_columns()

    creation_time = datetime(2024, 1, 1)
    ticket = create_ticket_at_time(boardid, column_id, creation_time)

    new_ticket = ticket.copy()
    new_ticket["title"] = "edited test ticket"
    new_ticket["size"] = 10

    edit_time = datetime(2024, 1, 2)
    edit_ticket_at_time(column_id, edit_time, new_ticket)

    response = api_client.get(reverse("events", args=[boardid]))
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[1] == {
        "ticketeventid": data[1]["ticketeventid"],
        "ticketid": ticket["ticketid"],
        "event_time": edit_time.isoformat() + "Z",
        "event_type": "UPDATE",
        "old_columnid": str(column_id),
        "new_columnid": str(column_id),
        "old_size": 5,
        "new_size": 10,
        "title": "edited test ticket",
    }

    resetDB()


@pytest.mark.django_db
def test_ticket_delete_event():
    """
    Test that correct events are returned for ticket delete
    """
    api_client = APIClient()

    boardid, column_id, _ = create_board_and_columns()

    creation_time = datetime(2024, 1, 1)
    ticket = create_ticket_at_time(boardid, column_id, creation_time)

    delete_time = datetime(2024, 1, 2)
    delete_ticket_at_time(column_id, delete_time, ticket["ticketid"])

    response = api_client.get(reverse("events", args=[boardid]))
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[1] == {
        "ticketeventid": data[1]["ticketeventid"],
        "ticketid": ticket["ticketid"],
        "event_time": delete_time.isoformat() + "Z",
        "event_type": "DELETE",
        "old_columnid": str(column_id),
        "new_columnid": None,
        "old_size": 5,
        "new_size": 0,
        "title": "test ticket",
    }

    resetDB()


@freeze_time("2024-01-04")
@pytest.mark.django_db
def test_cumulative_flow_default_params():
    """
    Test that cumulative flow chart data is returned correctly with default parameters
    """
    api_client = APIClient()
    boardid = create_board_with_events()

    url = reverse("cumulative_flow", args=[boardid])

    response = api_client.get(url)
    assert response.status_code == 200

    json_data = response.json()
    data = json_data["data"]
    column_names = json_data["columns"]

    assert len(data) == 4

    right_data = [
        {"name": "2024-01-01T00:00:00", "Column 1": 5, "Column 2": 0},
        {"name": "2024-01-02T00:00:00", "Column 1": 0, "Column 2": 10},
        {"name": "2024-01-03T00:00:00", "Column 1": 0, "Column 2": 15},
        {"name": "2024-01-04T00:00:00", "Column 1": 0, "Column 2": 5},
    ]

    assert data == right_data

    assert column_names == ["Column 1", "Column 2"]

    resetDB()


@pytest.mark.django_db
def test_cumulative_flow_with_params():
    """
    Test that cumulative flow chart data is returned correctly
    """
    api_client = APIClient()
    boardid = create_board_with_events()

    url = reverse("cumulative_flow", args=[boardid])
    url += "?time_unit=day&start_time=2024-01-02&end_time=2024-01-03"

    response = api_client.get(url)
    assert response.status_code == 200

    json_data = response.json()

    data = json_data["data"]
    columns_names = json_data["columns"]

    assert len(data) == 2

    assert data == [
        {"name": "2024-01-02T00:00:00", "Column 1": 0, "Column 2": 10},
        {"name": "2024-01-03T00:00:00", "Column 1": 0, "Column 2": 15},
    ]

    assert columns_names == ["Column 1", "Column 2"]

    resetDB()
