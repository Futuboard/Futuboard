import pytest
import futuboard.models as md
from rest_framework.test import APIClient
import uuid
from django.urls import reverse
import json

############################################################################################################
############################################# VIEW TESTS ###################################################
############################################################################################################


@pytest.mark.django_db
def test_get_all_boards():
    """
    Test the get_all_boards function in backend/futuboard/views/views.py
    Has two methods: GET and POST
        GET: Returns all boards
        POST: Creates a new board
    """
    api_client = APIClient()
    # Post 5 boards
    for i in range(5):
        response = api_client.post(
            reverse("get_all_boards"), {"id": uuid.uuid4(), "title": "board" + str(i), "password": "password" + str(i)}
        )
        assert response.status_code == 200
    # Get all boards
    response = api_client.get(reverse("get_all_boards"))
    data = response.json()
    assert len(data) == 5
    assert response.status_code == 200
    assert md.Board.objects.count() == 5
    # Delete all boards
    md.Board.objects.all().delete()
    # Get all boards
    response = api_client.get(reverse("get_all_boards"))
    data = response.json()
    assert len(data) == 0
    assert md.Board.objects.count() == 0
    # Clean up usergroups
    md.Usergroup.objects.all().delete()


@pytest.mark.django_db
def test_get_board_by_id():
    """
    Test the get_board_by_id function in backend/futuboard/views/views.py
    Has two methods: GET and POST
        GET: Returns a board by id
        POST: Returns a success message if the password is correct
    """
    api_client = APIClient()
    # Add 5 boards to the database
    boardids = [uuid.uuid4() for i in range(5)]
    for i in range(5):
        response = api_client.post(
            reverse("get_all_boards"), {"id": boardids[i], "title": "board" + str(i), "password": "password" + str(i)}
        )
        assert response.status_code == 200
    tokens = []
    # Post board by id (Password verification)
    for i in range(5):
        response = api_client.post(reverse("get_board_by_id", args=[boardids[i]]), {"password": "password" + str(i)})
        data = response.json()
        print(data)
        assert data["success"] is True
        assert data["token"] is not None
        tokens.append(data["token"])
        assert response.status_code == 200
    # Test getting board by id with wrong password
    response = api_client.post(reverse("get_board_by_id", args=[boardids[0]]), {"password": "wrongpassword"})
    data = response.json()
    print(data)
    assert data["success"] is False
    assert response.status_code == 200
    # Get board by id for all boards
    for i in range(5):
        response = api_client.get(
            reverse("get_board_by_id", args=[boardids[i]]), headers={"Authorization": f"Bearer {tokens[i]}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["boardid"] == str(boardids[i])
        assert data["title"] == "board" + str(i)
        assert response.status_code == 200
    # Delete all boards and usergroups
    md.Board.objects.all().delete()
    md.Usergroup.objects.all().delete()


@pytest.mark.django_db
def test_getting_board_requires_auth():
    api_client = APIClient()
    boardId = uuid.uuid4()

    creation_response = api_client.post(
        reverse("get_all_boards"), {"id": boardId, "title": "board", "password": "password"}
    )
    assert creation_response.status_code == 200

    get_response_unauthenticated = api_client.get(reverse("get_board_by_id", args=[boardId]))
    assert get_response_unauthenticated.status_code == 401


@pytest.mark.django_db
def test_get_columns_from_board():
    """
    Test the get_columns_from_board function in backend/futuboard/views/views.py
    Has two methods: GET and POST
        GET: Returns all columns from a board
        POST: Creates a new column in a board
    """
    api_client = APIClient()
    # Create a board and add 5 columns to it, of which 1 is a swimlane column
    boardid = uuid.uuid4()
    columnids = [uuid.uuid4() for i in range(5)]
    response = api_client.post(reverse("get_all_boards"), {"id": boardid, "title": "board", "password": "password"})
    assert response.status_code == 200
    # Non-swimlane columns
    for i in range(4):
        # Using json.dumps assures swimlane is a boolean not a string
        data = {"columnid": str(columnids[i]), "title": "column" + str(i), "position": i, "swimlane": False}
        response = api_client.post(
            reverse("get_columns_from_board", args=[boardid]), data=json.dumps(data), content_type="application/json"
        )
        assert response.status_code == 200

    # Swimlane column
    data = {"columnid": str(columnids[4]), "title": "column4", "position": 4, "swimlane": True}
    response = api_client.post(
        reverse("get_columns_from_board", args=[boardid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Get columns from board
    response = api_client.get(reverse("get_columns_from_board", args=[boardid]))
    data = response.json()
    assert len(data) == 5
    # Make sure there are 4 non-swimlane columns and 1 swimlane column
    assert len([column for column in data if column["swimlane"] is False]) == 4
    assert len([column for column in data if column["swimlane"] is True]) == 1
    assert md.Swimlanecolumn.objects.count() == 4
    assert md.Column.objects.count() == 5
    assert response.status_code == 200
    # Delete all columns
    md.Column.objects.all().delete()
    # Get columns from board
    response = api_client.get(reverse("get_columns_from_board", args=[boardid]))
    data = response.json()
    assert len(data) == 0
    assert response.status_code == 200
    # Delete all boards, swimlanecolumns and usergroups
    md.Board.objects.all().delete()
    md.Usergroup.objects.all().delete()
    md.Swimlanecolumn.objects.all().delete()


@pytest.mark.django_db
def test_get_tickets_from_column():
    """
    Test the get_tickets_from_column function in backend/futuboard/views/views.py
    Has three methods: GET, POST and PUT
        GET: Returns all tickets from a column
        POST: Creates a new ticket in a column
        PUT: Moves a ticket to a new column and updates the order of the tickets
    """
    api_client = APIClient()
    # Create a board and a column and add 5 tickets to it
    boardid = uuid.uuid4()
    columnid = uuid.uuid4()
    response = api_client.post(reverse("get_all_boards"), {"id": boardid, "title": "board", "password": "password"})
    assert response.status_code == 200
    data = {"columnid": str(columnid), "title": "column", "position": 0, "swimlane": False}
    response = api_client.post(
        reverse("get_columns_from_board", args=[boardid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200
    # Add 5 tickets to column
    ticketids = [uuid.uuid4() for i in range(5)]
    for i in range(5):
        data = {
            "ticketid": str(ticketids[i]),
            "title": "ticket" + str(i),
            "description": "description" + str(i),
            "position": i,
            "size": 5,
        }
        response = api_client.post(
            reverse("get_tickets_from_column", args=[boardid, columnid]),
            data=json.dumps(data),
            content_type="application/json",
        )
        assert response.status_code == 200
    # Get tickets from column
    response = api_client.get(reverse("get_tickets_from_column", args=[boardid, columnid]))
    data = response.json()
    assert len(data) == 5
    assert response.status_code == 200
    # Test PUT request to update ticket to a new column
    # Create a new column
    newcolumnid = uuid.uuid4()
    data = {
        "columnid": str(newcolumnid),
        "title": "newcolumn",
        "position": 1,
        "swimlane": False,
    }
    response = api_client.post(
        reverse("get_columns_from_board", args=[boardid]), data=json.dumps(data), content_type="application/json"
    )
    # List of ticketids to move to new column, move 1st and 4th ticket
    data = [
        {
            "ticketid": str(ticketids[0]),
        },
        {
            "ticketid": str(ticketids[3]),
        },
    ]

    response = api_client.put(
        reverse("get_tickets_from_column", args=[boardid, newcolumnid]),
        data=json.dumps(data),
        content_type="application/json",
    )
    assert response.status_code == 200
    # Get tickets from new column
    response = api_client.get(reverse("get_tickets_from_column", args=[boardid, newcolumnid]))
    data = response.json()
    assert len(data) == 2
    assert response.status_code == 200
    # Get tickets from old column
    response = api_client.get(reverse("get_tickets_from_column", args=[boardid, columnid]))
    data = response.json()
    assert len(data) == 3
    assert response.status_code == 200
    # Delete all columns, boards, tickets and usergroups
    md.Column.objects.all().delete()
    md.Board.objects.all().delete()
    md.Usergroup.objects.all().delete()
    md.Ticket.objects.all().delete()


@pytest.mark.django_db
def test_update_ticket():
    """
    Test the update_ticket function in backend/futuboard/views/views.py
    Has one method: PUT and DELETE
        PUT: Updates a ticket
        DELETE: Deletes a ticket
    """
    api_client = APIClient()
    # Create a board and a column and add a ticket to it
    boardid = uuid.uuid4()
    columnid = uuid.uuid4()
    response = api_client.post(reverse("get_all_boards"), {"id": boardid, "title": "board", "password": "password"})
    assert response.status_code == 200
    data = {"columnid": str(columnid), "title": "column", "position": 0, "swimlane": False}
    response = api_client.post(
        reverse("get_columns_from_board", args=[boardid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200

    # Add a ticket to column
    ticketid = uuid.uuid4()
    data = {
        "ticketid": str(ticketid),
        "title": "ticket",
        "description": "description",
        "position": 0,
        "size": 5,
    }
    response = api_client.post(
        reverse("get_tickets_from_column", args=[boardid, columnid]),
        data=json.dumps(data),
        content_type="application/json",
    )
    assert response.status_code == 200

    # Test PUT request to update ticket
    data = {
        "ticketid": str(ticketid),
        "title": "updatedticket",
        "description": "This is an updated description",
        "position": 0,
        "size": 5,
    }
    response = api_client.put(
        reverse("update_ticket", args=[columnid, ticketid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200

    # Get ticket by id
    response = api_client.get(reverse("get_tickets_from_column", args=[boardid, columnid]))
    data = response.json()
    print(data)
    assert data[0]["title"] == "updatedticket"
    assert data[0]["description"] == "This is an updated description"
    assert response.status_code == 200

    # Delete ticket
    response = api_client.delete(reverse("update_ticket", args=[columnid, ticketid]))
    assert response.status_code == 200
    assert md.Ticket.objects.count() == 0

    # Delete incase ticket isn't properly deleted
    md.Ticket.objects.all().delete()

    # Delete all columns, boards and usergroups
    md.Column.objects.all().delete()
    md.Board.objects.all().delete()
    md.Usergroup.objects.all().delete()


@pytest.mark.django_db
def test_update_column():
    """
    Test the update_column function in backend/futuboard/views/views.py
    Has two methods: PUT and DELETE
        PUT: Updates a column
        DELETE: Deletes column
    """
    api_client = APIClient()

    # Create a board and a column
    boardid = uuid.uuid4()
    columnid = uuid.uuid4()
    response = api_client.post(reverse("get_all_boards"), {"id": boardid, "title": "board", "password": "password"})
    assert response.status_code == 200
    data = {"columnid": str(columnid), "title": "column", "position": 0, "swimlane": False}
    response = api_client.post(
        reverse("get_columns_from_board", args=[boardid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200

    # Test PUT request to update column
    data = {"columnid": str(columnid), "title": "updatedcolumn", "position": 0, "swimlane": False}
    response = api_client.put(
        reverse("update_column", args=[boardid, columnid]), data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == 200

    # Get column by id
    response = api_client.get(reverse("get_columns_from_board", args=[boardid]))
    data = response.json()
    assert data[0]["title"] == "updatedcolumn"
    assert response.status_code == 200

    # Delete column
    response = api_client.delete(reverse("update_column", args=[boardid, columnid]))
    assert response.status_code == 200
    assert md.Column.objects.count() == 0

    # Delete incase column isn't properly deleted
    md.Column.objects.all().delete()

    # Delete all boards and usergroups
    md.Board.objects.all().delete()
    md.Usergroup.objects.all().delete()


@pytest.mark.django_db
def test_get_users_from_board():
    """
    Test the get_users_from_board function in backend/futuboard/views/views.py
    Has two methods: GET and POST
        GET: Returns all users from a board
        POST: Adds a user to a board
    """
    api_client = APIClient()
    # Create a board and add 5 users to it
    boardid = uuid.uuid4()
    response = api_client.post(reverse("get_all_boards"), {"id": boardid, "title": "board", "password": "password"})
    assert response.status_code == 200
    userids = [uuid.uuid4() for i in range(5)]
    for i in range(5):
        response = api_client.post(
            reverse("get_users_from_board", args=[boardid]),
            {"userid": str(userids[i]), "name": "user" + str(i), "color": "color" + str(i)},
        )
        assert response.status_code == 200
    # Get users from board
    response = api_client.get(reverse("get_users_from_board", args=[boardid]))
    data = response.json()
    assert len(data) == 5
    assert response.status_code == 200
    # Delete all usergroupusers
    md.UsergroupUser.objects.all().delete()
    # Get users from board
    response = api_client.get(reverse("get_users_from_board", args=[boardid]))
    data = response.json()
    assert len(data) == 0
    assert response.status_code == 200
    # Delete all boards usergroups and users
    md.Board.objects.all().delete()
    md.User.objects.all().delete()
    md.Usergroup.objects.all().delete()

    # Why is get_users_from_ticket defined twice in views.py? Test fails because of this, put test also not implemented due to this
    # @pytest.mark.django_db
    # def test_get_users_from_ticket():
    """
    Test the get_users_from_ticket function in backend/futuboard/views/views.py
    Has three methods: GET, POST and PUT
        GET: Returns all users from a ticket
        POST: Adds a user to a ticket
        PUT: Changes the position of a user to a new ticket
    """


#     api_client = APIClient()
#     # Create a board, a column, a ticket and add 5 users to it
#     boardid = uuid.uuid4()
#     columnid = uuid.uuid4()
#     ticketid = uuid.uuid4()
#     response = api_client.post(reverse('get_all_boards'), {'id': boardid, 'title': 'board', 'password': 'password'})
#     assert response.status_code == 200
#     data = {
#         'columnid': str(columnid),
#         'title': 'column',
#         'position': 0,
#         'swimlane': False
#     }
#     response = api_client.post(reverse('get_columns_from_board', args=[boardid]), data=json.dumps(data), content_type='application/json')
#     assert response.status_code == 200
#     data = {
#         'ticketid': str(ticketid),
#         'title': 'ticket',
#         'description': 'description',
#         'position': 0,
#         'size': 5,
#     }
#     response = api_client.post(reverse('get_tickets_from_column', args=[boardid, columnid]), data=json.dumps(data), content_type='application/json')
#     assert response.status_code == 200
#     userids = [uuid.uuid4() for i in range(5)]
#     for i in range(5):
#         response = api_client.post(reverse('get_users_from_ticket', args=[boardid, columnid, ticketid]), {'userid': str(userids[i]), 'name': 'user' + str(i), 'color': 'color' + str(i)})
#         assert response.status_code == 200
#     # Get users from ticket
#     response = api_client.get(reverse('get_users_from_ticket', args=[boardid, columnid, ticketid]))
#     data = response.json()
#     assert len(data) == 5
#     assert response.status_code == 200
#     # Delete all usergroupusers
#     md.UsergroupUser.objects.all().delete()
#     # Get users from ticket
#     response = api_client.get(reverse('get_users_from_ticket', args=[boardid, columnid, ticketid]))
#     data = response.json()
#     assert len(data) == 0
#     assert response.status_code == 200
#     # Delete all columns, boards, usergroups and users
#     md.Column.objects.all().delete()
#     md.Board.objects.all().delete()
#     md.User.objects.all().delete()


@pytest.mark.django_db
def test_update_user():
    """
    Test the update_user function in backend/futuboard/views/views.py
    Has one method: DELETE
        DELETE: Deletes a user
    """
    api_client = APIClient()
    # Create a board and a user
    boardid = uuid.uuid4()
    response = api_client.post(reverse("get_all_boards"), {"id": boardid, "title": "board", "password": "password"})
    assert response.status_code == 200
    response = api_client.post(reverse("get_users_from_board", args=[boardid]), {"name": "user", "color": "color"})
    data = response.json()
    # get user id from response
    print(data)
    userid = data["userid"]
    assert response.status_code == 200
    # Test DELETE request to update user
    response = api_client.delete(reverse("update_user", args=[userid]))
    assert response.status_code == 200
    # Check that amount of users is 0
    assert md.User.objects.count() == 0
    # Delete all boards and usergroups
    md.Board.objects.all().delete()
    md.Usergroup.objects.all().delete()
    md.UsergroupUser.objects.all().delete()
