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
    length = len(md.Ticket.objects.filter(columnid=columnId))

    new_ticket = md.Ticket(
        ticketid=ticketId,
        columnid=md.Column.objects.get(pk=columnId),
        title=title,
        description=description,
        color=color,
        storypoints=8,
        size=size,
        order=length,
        creation_date=timezone.now(),
        cornernote=cornernote,
    )
    new_ticket.save()
    return new_ticket


def resetDB():
    for model in django.apps.apps.get_models():
        model.objects.all().delete()
