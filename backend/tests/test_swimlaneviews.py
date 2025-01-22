import pytest
import futuboard.models as md
from .test_utils import addBoard, addColumn, addTicket, addAction, addSwimlanecolumn, resetDB
from rest_framework.test import APIClient
import uuid
from django.utils import timezone
from django.urls import reverse
import json

# TO-DO : Refactor to be like test_views.py

############################################################################################################
######################################### SWIMLANE VIEW TESTS ##############################################
############################################################################################################


@pytest.mark.django_db
def test_swimlanecolumns_on_column():
    """
    Test the swimlanecolumns_on_column function in backend/futuboard/views/swimlaneViews.py
    Has two methods: GET and POST
    GET: Returns all swimlanecolumns for a given column
    POST: Creates a new swimlanecolumn for a given column
    """
    client = APIClient()
    board = md.Board.objects.create(
        boardid=uuid.uuid4(),
        title="Test Board",
        creation_date=timezone.now(),
        passwordhash="test",
        salt="test",
    )
    columnid = uuid.uuid4()
    data = {"columnid": str(columnid), "title": "column4", "position": 4, "swimlane": True}
    response = client.post(
        reverse("columns_on_board", args=[board.boardid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Check that the 4 default swimlanecolumns are created
    assert len(md.Swimlanecolumn.objects.filter(columnid=columnid)) == 4
    # Get the swimlanecolumns for the column
    response = client.get(reverse("swimlanecolumns_on_column", args=[columnid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    # Create a new swimlanecolumn
    data = {
        "swimlanecolumnid": str(uuid.uuid4()),
        "columnid": str(columnid),
        "title": "new swimlanecolumn",
    }
    response = client.post(
        reverse("swimlanecolumns_on_column", args=[columnid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Check that the new swimlanecolumn is created
    assert len(md.Swimlanecolumn.objects.filter(columnid=columnid)) == 5
    # Get the swimlanecolumns for the column
    response = client.get(reverse("swimlanecolumns_on_column", args=[columnid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    # Clean up
    resetDB()


@pytest.mark.django_db
def test_action_on_swimlane():
    """
    Test the action_on_swimlane function in backend/futuboard/views/swimlaneViews.py
    Has three methods: GET, POST, and PUT

        GET: Returns all actions for a given swimlanecolumn and ticket

        POST: Creates a new action for a given swimlanecolumn and ticket

        PUT: Moves actions to a new swimlanecolumn, and updates the order of the actions
    """
    client = APIClient()
    board = md.Board.objects.create(
        boardid=uuid.uuid4(),
        title="Test Board",
        creation_date=timezone.now(),
        passwordhash="test",
        salt="test",
    )
    columnid = uuid.uuid4()
    data = {"columnid": str(columnid), "title": "column4", "position": 4, "swimlane": True}
    response = client.post(
        reverse("columns_on_board", args=[board.boardid]), data=json.dumps(data), content_type="application/json"
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
        reverse("tickets_on_column", args=[board.boardid, columnid]),
        data=json.dumps(data),
        content_type="application/json",
    )
    assert response.status_code == 200
    # Create a new swimlanecolumn
    swimlanecolumnid = uuid.uuid4()
    data = {
        "swimlanecolumnid": str(swimlanecolumnid),
        "columnid": str(columnid),
        "title": "new swimlanecolumn",
    }
    response = client.post(
        reverse("swimlanecolumns_on_column", args=[columnid]), data=json.dumps(data), content_type="application/json"
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
        }
        response = client.post(
            reverse("action_on_swimlane", args=[swimlanecolumnid, ticketid]),
            data=json.dumps(data),
            content_type="application/json",
        )
        assert response.status_code == 200
    # Get the actions for the swimlanecolumn and ticket
    response = client.get(reverse("get_actions_by_columnId", args=[columnid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    for action in data:
        assert action["swimlanecolumnid"] == str(swimlanecolumnid)
    # Create another swimlanecolumn to be moved to
    swimlanecolumnid2 = uuid.uuid4()
    data = {
        "swimlanecolumnid": str(swimlanecolumnid2),
        "columnid": str(columnid),
        "title": "new swimlanecolumn",
    }
    response = client.post(
        reverse("swimlanecolumns_on_column", args=[columnid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    data = [
        {
            "actionid": str(actionids[1]),
        },
        {
            "actionid": str(actionids[0]),
        },
        {
            "actionid": str(actionids[2]),
        },
    ]
    # Move the actions to the new swimlanecolumn
    response = client.put(
        reverse("action_on_swimlane", args=[swimlanecolumnid2, ticketid]),
        data=json.dumps(data),
        content_type="application/json",
    )
    assert response.status_code == 200
    # Get the actions for the new swimlanecolumn and ticket
    response = client.get(reverse("get_actions_by_columnId", args=[columnid]))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    for action in data:
        assert action["swimlanecolumnid"] == str(swimlanecolumnid2)
    # Check that the order of the actions has been updated
    assert data[0]["order"] == 0
    assert data[1]["order"] == 1
    assert data[2]["order"] == 2
    # Clean up
    resetDB()


@pytest.mark.django_db
def test_get_actions_by_columnId():
    """
    Test the get_actions_by_columnId function in backend/futuboard/views/swimlaneViews.py
    Has one method: GET

        GET: Returns all actions for a given column with a swimlane
    """
    # Initalize a client.
    client = APIClient()

    # Initalize some models in the backend using test_utils.py utilities.
    boardid = addBoard().boardid
    columnid = addColumn(boardid, uuid.uuid4(), title="swimlane", swimlane=True).columnid
    swimlanecolumnid = addSwimlanecolumn(columnid, uuid.uuid4()).swimlanecolumnid
    ticketid = addTicket(columnid, uuid.uuid4(), title="A test ticket").ticketid

    # At this point, there should be no actions.
    assert len(md.Action.objects.all()) == 0

    # Create an action into the swimlanecolumn associated with the column.
    addAction(ticketid, swimlanecolumnid, uuid.uuid4(), title="My test action")

    # At this point, there should be one action.
    assert len(md.Action.objects.all()) == 1

    # Attempt to retrieve the action.
    response = client.get(reverse("get_actions_by_columnId", args=[columnid]))

    # Check that the operation was successful.
    assert response.status_code == 200

    # Check that the response contains one action.
    data = response.json()
    assert len(data) == 1

    # Cleanup
    resetDB()


@pytest.mark.django_db
def test_update_action():
    """
    Test the update_action function in backend/futuboard/views/swimlaneViews.py
    Has one method: PUT

        PUT: updates action title
    """

    api_client = APIClient()

    # Create models for test using test_utils.py
    boardid = addBoard().boardid
    columnid = addColumn(boardid, uuid.uuid4(), title="swimlane", swimlane=True).columnid
    swimlanecolumnid = addSwimlanecolumn(columnid, uuid.uuid4()).swimlanecolumnid
    ticketid = addTicket(columnid, uuid.uuid4(), title="Test ticket").ticketid

    # Create an action.
    actionid = addAction(ticketid, swimlanecolumnid, uuid.uuid4(), title="My action").actionid

    # Test PUT request to update action.
    data = {
        "actionid": str(actionid),
        "swimlanecolumnid": str(swimlanecolumnid),
        "title": "My updated action title",
    }
    response = api_client.put(
        reverse("update_action", args=[actionid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200

    # Get action.
    response = api_client.get(reverse("get_actions_by_columnId", args=[columnid]))
    data = response.json()
    assert data[0]["title"] == "My updated action title"
    assert response.status_code == 200

    # Cleanup.
    resetDB()


@pytest.mark.django_db
def test_deleting_action():
    """
    Test deleting an action by id
    Test that the right action is deleted.
    """

    api_client = APIClient()

    boardid = addBoard(uuid.uuid4()).boardid
    columnid = addColumn(boardid, uuid.uuid4(), swimlane=True).columnid
    swimlanecolumnid = addSwimlanecolumn(columnid, uuid.uuid4()).swimlanecolumnid
    ticketid = addTicket(columnid, uuid.uuid4(), title="Test ticket").ticketid
    actionid = addAction(ticketid, swimlanecolumnid, uuid.uuid4(), title="My action").actionid
    actionid2 = addAction(ticketid, swimlanecolumnid, uuid.uuid4(), title="My action2").actionid

    response = api_client.delete(reverse("update_action", args=[actionid]))

    assert response.status_code == 200
    assert md.Action.objects.all()[0].actionid == actionid2
    assert md.Action.objects.count() == 1

    resetDB()


@pytest.mark.django_db
def test_creating_an_empty_action():
    """
    Test that new empty actions are rejected.
    """

    api_client = APIClient()

    boardid = addBoard(uuid.uuid4()).boardid
    columnid = addColumn(boardid, uuid.uuid4(), swimlane=True).columnid
    swimlanecolumnid = addSwimlanecolumn(columnid, uuid.uuid4()).swimlanecolumnid
    ticketid = addTicket(columnid, uuid.uuid4(), title="Test ticket").ticketid

    response = api_client.post(
        reverse("action_on_swimlane", args=[swimlanecolumnid, ticketid]), {"actionid": uuid.uuid4(), "title": ""}
    )

    assert response.status_code == 400
    assert md.Action.objects.count() == 0

    resetDB()
