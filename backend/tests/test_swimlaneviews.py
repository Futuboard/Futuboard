import pytest
import futuboard.models as md
from rest_framework.test import APIClient
import uuid
from django.utils import timezone
from django.urls import reverse
import json

############################################################################################################
######################################### SWIMLANE VIEW TESTS ##############################################
############################################################################################################


@pytest.mark.django_db
def test_swimlanecolumn_view():
    """
    Test the swimlanecolumn_view function in backend/futuboard/views/swimlaneViews.py
    Has two methods: GET and POST
    GET: Returns all swimlanecolumns for a given column
    POST: Creates a new swimlanecolumn for a given column
    """
    client = APIClient()
    board = md.Board.objects.create(
        boardid=uuid.uuid4(),
        title="Test Board",
        creator="Test User",
        creation_date=timezone.now(),
        passwordhash="test",
        salt="test",
    )
    columnid = uuid.uuid4()
    data = {"columnid": str(columnid), "title": "column4", "position": 4, "swimlane": True}
    response = client.post(
        reverse("get_columns_from_board", args=[board.boardid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Check that the 4 default swimlanecolumns are created
    assert len(md.Swimlanecolumn.objects.filter(columnid=columnid)) == 4
    # Get the swimlanecolumns for the column
    response = client.get(reverse("swimlanecolumn_view", args=[columnid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    # Create a new swimlanecolumn
    data = {
        "swimlanecolumnid": str(uuid.uuid4()),
        "columnid": str(columnid),
        "color": "red",
        "title": "new swimlanecolumn",
    }
    response = client.post(
        reverse("swimlanecolumn_view", args=[columnid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Check that the new swimlanecolumn is created
    assert len(md.Swimlanecolumn.objects.filter(columnid=columnid)) == 5
    # Get the swimlanecolumns for the column
    response = client.get(reverse("swimlanecolumn_view", args=[columnid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    # Clean up
    md.Board.objects.all().delete()
    md.Column.objects.all().delete()
    md.Swimlanecolumn.objects.all().delete()
    md.Usergroup.objects.all().delete()


@pytest.mark.django_db
def test_action_view():
    """
    Test the action_view function in backend/futuboard/views/swimlaneViews.py
    Has three methods: GET, POST, and PUT

        GET: Returns all actions for a given swimlanecolumn and ticket

        POST: Creates a new action for a given swimlanecolumn and ticket

        PUT: Moves actions to a new swimlanecolumn, and updates the order of the actions
    """
    client = APIClient()
    board = md.Board.objects.create(
        boardid=uuid.uuid4(),
        title="Test Board",
        creator="Test User",
        creation_date=timezone.now(),
        passwordhash="test",
        salt="test",
    )
    columnid = uuid.uuid4()
    data = {"columnid": str(columnid), "title": "column4", "position": 4, "swimlane": True}
    response = client.post(
        reverse("get_columns_from_board", args=[board.boardid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Create a new ticket
    ticketid = uuid.uuid4()
    data = {
        "ticketid": str(ticketid),
        "title": "new ticket",
        "description": "new ticket description",
        "position": 1,
        "size": 10,
    }
    response = client.post(
        reverse("get_tickets_from_column", args=[board.boardid, columnid]),
        data=json.dumps(data),
        content_type="application/json",
    )
    assert response.status_code == 200
    # Create a new swimlanecolumn
    swimlanecolumnid = uuid.uuid4()
    data = {
        "swimlanecolumnid": str(swimlanecolumnid),
        "columnid": str(columnid),
        "color": "red",
        "title": "new swimlanecolumn",
    }
    response = client.post(
        reverse("swimlanecolumn_view", args=[columnid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Create 3 new actions
    actionids = [uuid.uuid4(), uuid.uuid4(), uuid.uuid4()]
    for i in range(3):
        data = {
            "actionid": str(actionids[i]),
            "swimlanecolumnid": str(swimlanecolumnid),
            "title": "action" + str(i),
            "description": "action description" + str(i),
            "color": "red",
        }
        response = client.post(
            reverse("action_view", args=[swimlanecolumnid, ticketid]),
            data=json.dumps(data),
            content_type="application/json",
        )
        assert response.status_code == 200
    # Get the actions for the swimlanecolumn and ticket
    response = client.get(reverse("action_view", args=[swimlanecolumnid, ticketid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Create another swimlanecolumn to be moved to
    swimlanecolumnid2 = uuid.uuid4()
    data = {
        "swimlanecolumnid": str(swimlanecolumnid2),
        "columnid": str(columnid),
        "color": "red",
        "title": "new swimlanecolumn",
    }
    response = client.post(
        reverse("swimlanecolumn_view", args=[columnid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    data = [
        {
            "actionid": str(actionids[0]),
        },
        {
            "actionid": str(actionids[1]),
        },
        {
            "actionid": str(actionids[2]),
        },
    ]
    # Move the actions to the new swimlanecolumn
    response = client.put(
        reverse("action_view", args=[swimlanecolumnid2, ticketid]),
        data=json.dumps(data),
        content_type="application/json",
    )
    assert response.status_code == 200
    # Get the actions for the new swimlanecolumn and ticket
    response = client.get(reverse("action_view", args=[swimlanecolumnid2, ticketid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Check that the order of the actions has been updated
    assert data[0]["order"] == 0
    assert data[1]["order"] == 1
    assert data[2]["order"] == 2
    # Check that the actions have been removed from the old swimlanecolumn
    response = client.get(reverse("action_view", args=[swimlanecolumnid, ticketid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
    # Clean up
    md.Board.objects.all().delete()
    md.Column.objects.all().delete()
    md.Swimlanecolumn.objects.all().delete()
    md.Ticket.objects.all().delete()
    md.Action.objects.all().delete()
    md.Usergroup.objects.all().delete()
