import pytest
import futuboard.models as md
import uuid
from django.utils import timezone
import futuboard.verification as ver


############################################################################################################
############################################# MODEL TESTS ##################################################
############################################################################################################

"""
Currently the models do not have any model specific methods, so the tests are only for creating and deleting objects.
"""

"""
Test creating n users and check that they are created properly. Check that user deletion also works.
"""


@pytest.mark.django_db
def test_user():
    n = 10
    board = md.Board.objects.create(
        boardid=uuid.uuid4(),
        description="Test board",
        title="Board",
        creator="John",
        creation_date=timezone.now(),
        passwordhash=ver.new_password("password"),
        salt="",
    )
    for i in range(n):
        md.User.objects.create(name=f"user{i}", color=f"color{i}", boardid=board)
    assert md.User.objects.count() == n
    print(board)
    for i in range(n):
        user = md.User.objects.get(name=f"user{i}")
        assert user.name == f"user{i}"
        assert user.color == f"color{i}"
        user.delete()
    assert md.User.objects.count() == 0


"""
Test creating n boards and check that they are created properly. Check that board deletion also works.
Also check that the password is hashed and verified properly.
"""


@pytest.mark.django_db
def test_board():
    n = 10
    boardids = [uuid.uuid4() for i in range(n)]
    for i in range(n):
        md.Board.objects.create(
            boardid=boardids[i],
            description=f"Test board{i}",
            title=f"Board{i}",
            creator=f"John{i}",
            creation_date=timezone.now(),
            passwordhash=ver.new_password(f"password{i}"),
            salt="",
        )
    assert md.Board.objects.count() == n
    i = 0
    for boardid in boardids:
        board = md.Board.objects.get(boardid=boardid)
        assert board.boardid in boardids
        assert board.description == f"Test board{i}"
        assert board.title == f"Board{i}"
        assert board.creator == f"John{i}"
        assert ver.verify_password(f"password{i}", board.passwordhash)
        i += 1
        board.delete()
    assert md.Board.objects.count() == 0


"""
Test that the column table is created properly and that columns can be created and deleted properly.
"""


@pytest.mark.django_db
def test_column():
    n = 10
    boardids = [uuid.uuid4() for i in range(n)]
    columnids = [uuid.uuid4() for i in range(n)]
    for i in range(n):
        md.Board.objects.create(
            boardid=boardids[i],
            description=f"Test board{i}",
            title=f"Board{i}",
            creator=f"John{i}",
            creation_date=timezone.now(),
            passwordhash=ver.new_password(f"password{i}"),
            salt="",
        )
        md.Column.objects.create(
            columnid=columnids[i],
            boardid=md.Board.objects.get(pk=boardids[i]),
            wip_limit=5,
            color=f"color{i}",
            description=f"description{i}",
            title=f"title{i}",
            ordernum=i,
            creation_date=timezone.now(),
            swimlane=False,
        )
    assert md.Column.objects.count() == n
    i = 0
    for columnid in columnids:
        column = md.Column.objects.get(columnid=columnid)
        assert column.columnid in columnids
        assert column.wip_limit == 5
        assert column.color == f"color{i}"
        assert column.description == f"description{i}"
        assert column.title == f"title{i}"
        assert column.ordernum == i
        assert column.swimlane is False
        i += 1
        column.delete()
    assert md.Column.objects.count() == 0
    # Clean up boards
    for i in range(n):
        md.Board.objects.get(boardid=boardids[i]).delete()


"""
Test that the swimlanecolumn table is created properly and that swimlanecolumns can be created and deleted properly.
"""


@pytest.mark.django_db
def test_swimlanecolumn():
    n = 10
    columnids = [uuid.uuid4() for i in range(n)]
    boardids = [uuid.uuid4() for i in range(n)]
    swimlanecolumnids = [uuid.uuid4() for i in range(n)]
    for i in range(n):
        md.Column.objects.create(
            columnid=columnids[i],
            boardid=md.Board.objects.create(
                boardid=boardids[i],
                description=f"Test board{i}",
                title=f"Board{i}",
                creator=f"John{i}",
                creation_date=timezone.now(),
                passwordhash=ver.new_password(f"password{i}"),
                salt="",
            ),
            wip_limit=5,
            color=f"color{i}",
            description=f"description{i}",
            title=f"title{i}",
            ordernum=i,
            creation_date=timezone.now(),
            swimlane=True,
        )
        md.Swimlanecolumn.objects.create(
            swimlanecolumnid=swimlanecolumnids[i],
            columnid=md.Column.objects.get(columnid=columnids[i]),
            color=f"color{i}",
            title=f"title{i}",
            ordernum=i,
        )
    assert md.Swimlanecolumn.objects.count() == n
    i = 0
    for swimlanecolumnid in swimlanecolumnids:
        swimlanecolumn = md.Swimlanecolumn.objects.get(swimlanecolumnid=swimlanecolumnid)
        assert swimlanecolumn.swimlanecolumnid in swimlanecolumnids
        assert swimlanecolumn.columnid.columnid in columnids
        assert swimlanecolumn.color == f"color{i}"
        assert swimlanecolumn.title == f"title{i}"
        assert swimlanecolumn.ordernum == i
        i += 1
        swimlanecolumn.delete()
    assert md.Swimlanecolumn.objects.count() == 0
    # Clean up columns and boards
    for i in range(n):
        md.Column.objects.get(columnid=columnids[i]).delete()
        md.Board.objects.get(boardid=boardids[i]).delete()


@pytest.mark.django_db
def test_action():
    n = 10
    swimlanecolumnids = [uuid.uuid4() for i in range(n)]
    actionids = [uuid.uuid4() for i in range(n)]
    columnids = [uuid.uuid4() for i in range(n)]
    boardids = [uuid.uuid4() for i in range(n)]
    for i in range(n):
        md.Swimlanecolumn.objects.create(
            swimlanecolumnid=swimlanecolumnids[i],
            columnid=md.Column.objects.create(
                columnid=columnids[i],
                boardid=md.Board.objects.create(
                    boardid=boardids[i],
                    description=f"Test board{i}",
                    title=f"Board{i}",
                    creator=f"John{i}",
                    creation_date=timezone.now(),
                    passwordhash=ver.new_password(f"password{i}"),
                    salt="",
                ),
                wip_limit=5,
                color=f"color{i}",
                description=f"description{i}",
                title=f"title{i}",
                ordernum=i,
                creation_date=timezone.now(),
                swimlane=True,
            ),
            color=f"color{i}",
            title=f"title{i}",
            ordernum=i,
        )
        md.Action.objects.create(
            actionid=actionids[i],
            swimlanecolumnid=md.Swimlanecolumn.objects.get(swimlanecolumnid=swimlanecolumnids[i]),
            title=f"title{i}",
            color=f"color{i}",
            order=i,
            creation_date=timezone.now(),
        )
    assert md.Action.objects.count() == n
    i = 0
    for action in actionids:
        action = md.Action.objects.get(pk=action)
        assert action.actionid in actionids
        assert action.swimlanecolumnid.swimlanecolumnid in swimlanecolumnids
        assert action.title == f"title{i}"
        assert action.color == f"color{i}"
        assert action.order == i
        i += 1
        action.delete()
    assert md.Action.objects.count() == 0
    # Clean up swimlanecolumns and columns
    for i in range(n):
        md.Swimlanecolumn.objects.get(swimlanecolumnid=swimlanecolumnids[i]).delete()
        md.Column.objects.get(columnid=columnids[i]).delete()
        md.Board.objects.get(boardid=boardids[i]).delete()


"""
Test that the ticket table is created properly and that tickets can be created and deleted properly.
"""


@pytest.mark.django_db
def test_ticket():
    n = 10
    columnids = [uuid.uuid4() for i in range(n)]
    boardids = [uuid.uuid4() for i in range(n)]
    ticketids = [uuid.uuid4() for i in range(n)]
    for i in range(n):
        md.Column.objects.create(
            columnid=columnids[i],
            boardid=md.Board.objects.create(
                boardid=boardids[i],
                description=f"Test board{i}",
                title=f"Board{i}",
                creator=f"John{i}",
                creation_date=timezone.now(),
                passwordhash=ver.new_password(f"password{i}"),
                salt="",
            ),
            wip_limit=5,
            color=f"color{i}",
            description=f"description{i}",
            title=f"title{i}",
            ordernum=i,
            creation_date=timezone.now(),
            swimlane=True,
        )
        md.Ticket.objects.create(
            ticketid=ticketids[i],
            columnid=md.Column.objects.get(columnid=columnids[i]),
            title=f"title{i}",
            description=f"description{i}",
            creation_date=timezone.now(),
            order=i,
        )
    assert md.Ticket.objects.count() == n
    i = 0
    for ticketid in ticketids:
        ticket = md.Ticket.objects.get(ticketid=ticketid)
        assert ticket.ticketid in ticketids
        assert ticket.columnid.columnid in columnids
        assert ticket.title == f"title{i}"
        assert ticket.description == f"description{i}"
        assert ticket.order == i
        i += 1
        ticket.delete()
    assert md.Ticket.objects.count() == 0
    # Clean up boards and columns
    for i in range(n):
        md.Column.objects.get(columnid=columnids[i]).delete()
        md.Board.objects.get(boardid=boardids[i]).delete()
