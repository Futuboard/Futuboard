import futuboard.models as md
from django.utils import timezone
import django.apps
from ..futuboard.verification import new_password

# Utility functions


def addBoard(boardId, title="title", password="", description=""):
    new_board = md.Board(
        boardid=boardId,
        description=description,
        title=title,
        creation_date=timezone.now(),
        passwordhash="" if password == "" else new_password(password),
        salt="",
    )
    new_board.save()
    return new_board


def addColumn(boardId, columnId, title="", swimlane=False):
    length = len(md.Column.objects.filter(boardid=boardId))

    new_column = md.Column(
        columnid=columnId,
        boardid=md.Board.objects.get(pk=boardId),
        description="",
        title=title,
        ordernum=length,
        creation_date=timezone.now(),
        swimlane=swimlane,
    )
    new_column.save()
    return new_column


def addTicket(columnId, ticketId, title="", description="", color="", size=0, cornernote=""):
    new_ticket = md.Ticket(
        ticketid=ticketId,
        columnid=md.Column.objects.get(pk=columnId),
        title=title,
        description=description,
        color=color,
        storypoints=8,
        size=size,
        order=0,
        creation_date=timezone.now(),
        cornernote=cornernote,
    )

    same_column_tickets = md.Ticket.objects.filter(columnid=new_ticket.columnid)
    for ticket in same_column_tickets:
        ticket.order += 1
        ticket.save()

    new_ticket.save()
    return new_ticket


def addSwimlanecolumn(columnId, swimlanecolumnId, title=""):
    length = len(md.Swimlanecolumn.objects.filter(columnid=columnId))

    new_swimlanecolumn = md.Swimlanecolumn(
        swimlanecolumnid=swimlanecolumnId,
        columnid=md.Column.objects.get(pk=columnId),
        title=title,
        ordernum=length,
    )
    new_swimlanecolumn.save()
    return new_swimlanecolumn


def addAction(ticketId, swimlanecolumnId, actionId, title=""):
    new_action = md.Action(
        actionid=actionId,
        ticketid=md.Ticket.objects.get(pk=ticketId),
        swimlanecolumnid=md.Swimlanecolumn.objects.get(pk=swimlanecolumnId),
        title=title,
        order=0,
        creation_date=timezone.now(),
    )
    new_action.save()

    same_swimlane_actions = md.Action.objects.filter(
        swimlanecolumnid=new_action.swimlanecolumnid, ticketid=new_action.ticketid
    )
    for action in same_swimlane_actions:
        action.order += 1
        action.save()

    return new_action


def resetDB():
    for model in django.apps.apps.get_models():
        model.objects.all().delete()
