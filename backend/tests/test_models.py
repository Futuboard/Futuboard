import pytest
import futuboard.models as md
from django.db import connection
from django.conf import settings
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
    for i in range(n):
        md.User.objects.create(name=f"user{i}", color=f"color{i}")
    assert md.User.objects.count() == n
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
        assert ver.verify_password(f"password{i}", board, board.passwordhash)
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
Test that the usergroup table is created properly and that usergroups can be created and deleted properly.
"""


@pytest.mark.django_db
def test_usergroup():
    n = 10
    usergroupids = [uuid.uuid4() for i in range(n)]
    boardids = [uuid.uuid4() for i in range(n)]
    columnids = [uuid.uuid4() for i in range(n)]
    ticketids = [uuid.uuid4() for i in range(n)]
    actionids = [uuid.uuid4() for i in range(n)]
    for i in range(n):
        md.Usergroup.objects.create(
            usergroupid=usergroupids[i],
            boardid=md.Board.objects.create(boardid=boardids[i], creation_date=timezone.now()),
            ticketid=md.Ticket.objects.create(
                ticketid=ticketids[i],
                order=i,
                columnid=md.Column.objects.create(
                    columnid=columnids[i],
                    ordernum=i,
                    boardid=md.Board.objects.get(pk=boardids[i]),
                    creation_date=timezone.now(),
                    swimlane=False,
                ),
            ),
            actionid=md.Action.objects.create(actionid=actionids[i], order=i),
            type=f"type{i}",
        )
    assert md.Usergroup.objects.count() == n
    i = 0
    for usergroupid in usergroupids:
        usergroup = md.Usergroup.objects.get(usergroupid=usergroupid)
        assert usergroup.usergroupid in usergroupids
        assert usergroup.boardid.boardid in boardids
        assert usergroup.ticketid.ticketid in ticketids
        assert usergroup.actionid.actionid in actionids
        assert usergroup.type == f"type{i}"
        i += 1
        usergroup.delete()
    assert md.Usergroup.objects.count() == 0
    # Clean up boards, tickets, actions and columns
    for i in range(n):
        md.Board.objects.get(boardid=boardids[i]).delete()


"""
Test that the usergroupuser table is created properly and that usergroupusers can be created and deleted properly.
"""


@pytest.mark.django_db
def test_usergroupuser():
    n = 10
    usergroupids = [uuid.uuid4() for i in range(n)]
    userids = [uuid.uuid4() for i in range(n)]
    boardids = [uuid.uuid4() for i in range(n)]
    for i in range(n):
        md.Usergroup.objects.create(
            usergroupid=usergroupids[i],
            boardid=md.Board.objects.create(boardid=boardids[i], creation_date=timezone.now()),
            type=f"type{i}",
        )
        md.User.objects.create(userid=userids[i], name=f"name{i}", color=f"color{i}")
        md.UsergroupUser.objects.create(
            usergroupid=md.Usergroup.objects.get(usergroupid=usergroupids[i]),
            userid=md.User.objects.get(userid=userids[i]),
        )
    assert md.UsergroupUser.objects.count() == n
    i = 0
    for usergroupid in usergroupids:
        usergroupuser = md.UsergroupUser.objects.get(usergroupid=usergroupid)
        assert usergroupuser.usergroupid.usergroupid in usergroupids
        assert usergroupuser.userid.userid in userids
        i += 1
        usergroupuser.delete()
    assert md.UsergroupUser.objects.count() == 0
    # Clean up usergroups, boards and users
    for i in range(n):
        md.Usergroup.objects.get(usergroupid=usergroupids[i]).delete()
        md.Board.objects.get(boardid=boardids[i]).delete()
        md.User.objects.get(userid=userids[i]).delete()


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
Test that the event table is created properly and that events can be created and deleted properly.
"""


@pytest.mark.django_db
def test_event():
    n = 10
    boardids = [uuid.uuid4() for i in range(n)]
    eventids = [uuid.uuid4() for i in range(n)]
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
        md.Event.objects.create(
            eventid=eventids[i],
            boardid=md.Board.objects.get(boardid=boardids[i]),
            timestamp=timezone.now(),
            objecttype=f"objecttype{i}",
            objectid=eventids[i],
            action=f"action{i}",
        )
    assert md.Event.objects.count() == n
    i = 0
    for eventid in eventids:
        event = md.Event.objects.get(eventid=eventid)
        assert event.eventid in eventids
        assert event.boardid.boardid in boardids
        assert event.objecttype == f"objecttype{i}"
        assert event.objectid in eventids
        assert event.action == f"action{i}"
        i += 1
        event.delete()
    assert md.Event.objects.count() == 0
    # Clean up boards
    for i in range(n):
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


# Test that the tables are created properly when migrations are run for testing
@pytest.mark.django_db
@pytest.mark.skip(reason="Use when migration problems occur")
def test_print_tables():
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
    print("Tables:")
    print(tables)
    print("Length of tables:")
    print(len(tables))
    # Get the default database configuration
    default_db = settings.DATABASES["default"]
    print("Default database:")
    print(default_db)
