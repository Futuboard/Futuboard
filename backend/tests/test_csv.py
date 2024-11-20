import pytest
import futuboard.models as md
from rest_framework.test import APIClient
import uuid
from django.utils import timezone
from django.urls import reverse
import json
import random
from django.core.files.uploadedfile import SimpleUploadedFile


############################################################################################################
###################################### BOARD IMPORT/EXPORT TESTS ###########################################
############################################################################################################


@pytest.mark.django_db
def test_import_export():
    """
    Test creating n random boards and exporting them to a csv file and then importing them back

    Check that the imported boards are the same as the exported boards, can have different titles, passwords, ids etc.
    Export has one method: GET
        GET: Returns a csv file with the board data
    Import has one method: POST
        POST: Imports a csv file with the board data
    """
    client = APIClient()
    # Create n random boards
    n = 10
    boards = []
    for i in range(n):
        board = md.Board.objects.create(
            boardid=uuid.uuid4(),
            title=f"Test Board{i}",
            creator=f"Test User{i}",
            creation_date=timezone.now(),
            description="",
            passwordhash="test",
            salt="test",
        )
        boards.append(board)
    num = 0
    # Fill boards with random data
    for board in boards:
        # Create n users for the board
        n_users = 10
        users = []
        for i in range(n_users):
            users.append(md.User.objects.create(userid=uuid.uuid4(), name=f"user{i}", color="red", boardid=board))
        # Create n columns for the board
        n_columns = random.randint(1, 10)
        for i in range(n_columns - 1):
            column = md.Column.objects.create(
                columnid=uuid.uuid4(), boardid=board, title=f"column{i}", ordernum=i, swimlane=False
            )
            n_tickets = random.randint(1, 10)
            for j in range(n_tickets):
                ticket = md.Ticket.objects.create(
                    ticketid=uuid.uuid4(), columnid=column, title=f"ticket{j}", description="test", order=j
                )

                n_users = random.randint(1, 10)
                random.shuffle(users)
                for k in range(n_users):
                    users[k].tickets.add(md.Ticket.objects.get(ticketid=ticket.ticketid))
        # One column that is a swimlane
        column = md.Column.objects.create(
            columnid=uuid.uuid4(), boardid=board, title=f"column{n_columns-1}", ordernum=n_columns - 1, swimlane=True
        )
        n_swimlanecolumns = random.randint(1, 10)
        for i in range(n_swimlanecolumns):
            swimlanecolumn = md.Swimlanecolumn.objects.create(
                swimlanecolumnid=uuid.uuid4(), columnid=column, title=f"swimlanecolumn{i}", color="red", ordernum=i
            )
        # Tickets for the swimlane column
        n_tickets = random.randint(1, 10)
        tickets = []
        for j in range(n_tickets):
            tickets.append(
                md.Ticket.objects.create(
                    ticketid=uuid.uuid4(), columnid=column, title=f"ticket{j}", description="test", order=j
                )
            )
            n_users = random.randint(1, 10)
            random.shuffle(users)
            for k in range(n_users):
                users[k].tickets.add(md.Ticket.objects.get(ticketid=ticket.ticketid))
        # Actions for the ticket
        for swimlanecolumn in md.Swimlanecolumn.objects.filter(columnid=column):
            n_actions = random.randint(1, 10)
            for k in range(n_actions):
                action = md.Action.objects.create(
                    actionid=uuid.uuid4(),
                    ticketid=tickets[k % n_tickets],
                    swimlanecolumnid=swimlanecolumn,
                    title=f"action{k}",
                    color="red",
                    order=k,
                )
                n_users = random.randint(1, 10)
                random.shuffle(users)
                for ii in range(n_users):
                    users[k].actions.add(md.Action.objects.get(actionid=action.actionid))
        # Export the board
        response = client.get(reverse("export_board_data", args=[boards[num].boardid, "test.csv"]))
        data = response.content
        # Create a file from the data
        file = SimpleUploadedFile("test.csv", data, content_type="text/csv")
        # print file content to see if it is correct
        print(file)
        assert response.status_code == 200
        # Import the board, response should have the data of the exported board csv as a content disposition
        new_boardid = uuid.uuid4()
        board_data = {"title": "Test Board", "password": "abc"}
        board_data = json.dumps(board_data)
        response = client.post(reverse("import_board_data", args=[new_boardid]), {"board": board_data, "file": file})
        assert response.status_code == 200
        # Check that the imported board is the same as the exported board
        imported_board = md.Board.objects.get(boardid=new_boardid)
        # Creator and description should be the same, other fields can be different
        assert imported_board.creator == board.creator
        assert imported_board.description == board.description

        # Check that the columns are the same
        imported_columns = md.Column.objects.filter(boardid=imported_board)
        columns = md.Column.objects.filter(boardid=board)
        assert len(imported_columns) == len(columns)

        # Check that users are the same
        imported_users = md.User.objects.filter(boardid=imported_board)
        users = md.User.objects.filter(boardid=board)

        assert len(imported_users) == len(users)
        assert imported_users[0].name == users[0].name
        assert imported_users[0].color == users[0].color

        # TODO: Should test that the users have the same tickets and actions

        # Check that the tickets are the same
        # Sort both column lists by ordernum
        imported_columns = list(imported_columns)
        columns = list(columns)
        imported_columns.sort(key=lambda x: x.ordernum)
        columns.sort(key=lambda x: x.ordernum)
        for j in range(len(columns)):
            imported_tickets = md.Ticket.objects.filter(columnid=imported_columns[j])
            tickets = md.Ticket.objects.filter(columnid=columns[j])
            # Sort both ticket lists by order
            imported_tickets = list(imported_tickets)
            tickets = list(tickets)
            imported_tickets.sort(key=lambda x: x.order)
            tickets.sort(key=lambda x: x.order)
            assert len(imported_tickets) == len(tickets)
            for i in range(len(tickets)):
                imported_ticket = imported_tickets[i]
                ticket = tickets[i]
                assert imported_ticket.title == ticket.title
                assert imported_ticket.description == ticket.description
                assert imported_ticket.color == ticket.color
                assert imported_ticket.storypoints == ticket.storypoints
                assert imported_ticket.size == ticket.size
                assert imported_ticket.order == ticket.order
                assert imported_ticket.creation_date == ticket.creation_date
                assert imported_ticket.cornernote == ticket.cornernote
                if columns[j].swimlane:
                    # Check that the actions are the same
                    imported_actions = md.Action.objects.filter(ticketid=imported_ticket)
                    actions = md.Action.objects.filter(ticketid=ticket)
                    imported_actions = list(imported_actions)
                    actions = list(actions)
                    imported_actions.sort(key=lambda x: x.order)
                    actions.sort(key=lambda x: x.order)
                    assert len(imported_actions) == len(actions)
                    for k in range(len(actions)):
                        imported_action = imported_actions[k]
                        action = actions[k]
                        assert imported_action.title == action.title
                        assert imported_action.color == action.color
                        assert imported_action.order == action.order
        num += 1
    # Clean up everything
    md.Action.objects.all().delete()
    md.Ticket.objects.all().delete()
    md.Swimlanecolumn.objects.all().delete()
    md.Column.objects.all().delete()
    md.Board.objects.all().delete()
    md.User.objects.all().delete()
