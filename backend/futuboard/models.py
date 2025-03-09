# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
import uuid
from django.utils.timezone import now


class Action(models.Model):
    actionid = models.UUIDField(db_column="actionID", primary_key=True)
    ticketid = models.ForeignKey("Ticket", models.CASCADE, db_column="ticketID", blank=True, null=True)
    swimlanecolumnid = models.ForeignKey(
        "Swimlanecolumn", models.CASCADE, db_column="swimlaneColumnID", blank=True, null=True
    )
    title = models.TextField(blank=True, null=True)
    order = models.IntegerField()
    creation_date = models.DateTimeField(default=now)

    class Meta:
        db_table = "Action"


class Board(models.Model):
    boardid = models.UUIDField(db_column="boardID", primary_key=True, default=uuid.uuid4)
    description = models.TextField(blank=True, null=True)
    title = models.TextField()
    background_color = models.TextField(default="#ffffff")
    creation_date = models.DateTimeField(default=now)
    passwordhash = models.TextField(db_column="passwordHash")
    salt = models.TextField()
    default_ticket_title = models.TextField(blank=True, null=True)
    default_ticket_description = models.TextField(blank=True, null=True)
    default_ticket_color = models.TextField(blank=True, null=True)
    default_ticket_size = models.IntegerField(blank=True, null=True)
    default_ticket_cornernote = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "Board"


class Column(models.Model):
    columnid = models.UUIDField(db_column="columnID", primary_key=True)
    boardid = models.ForeignKey(Board, models.CASCADE, db_column="boardID")
    wip_limit = models.IntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    title = models.TextField(default="")
    ordernum = models.IntegerField(db_column="orderNum")
    creation_date = models.DateTimeField(default=now)
    swimlane = models.BooleanField()
    wip_limit_story = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "Column"


class Swimlanecolumn(models.Model):
    swimlanecolumnid = models.UUIDField(db_column="swimlaneColumnID", default=uuid.uuid4, primary_key=True)
    columnid = models.ForeignKey(Column, models.CASCADE, db_column="columnID", blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    ordernum = models.IntegerField(db_column="orderNum")

    class Meta:
        db_table = "SwimlaneColumn"


class Ticket(models.Model):
    ticketid = models.UUIDField(db_column="ticketID", primary_key=True)
    columnid = models.ForeignKey(Column, models.CASCADE, db_column="columnID")
    title = models.TextField(default="")
    description = models.TextField(default="")
    color = models.TextField(blank=True, null=True)
    size = models.IntegerField(default=0)
    order = models.IntegerField()
    creation_date = models.DateTimeField(default=now)
    cornernote = models.TextField(db_column="cornerNote", default="")

    class Meta:
        db_table = "Ticket"


class User(models.Model):
    userid = models.UUIDField(db_column="userID", default=uuid.uuid4, primary_key=True)
    name = models.TextField(blank=True, null=True)
    boardid = models.ForeignKey(Board, models.CASCADE, db_column="boardID")
    tickets = models.ManyToManyField(Ticket)
    actions = models.ManyToManyField(Action)

    class Meta:
        db_table = "User"


class BoardTemplate(models.Model):
    boardtemplateid = models.UUIDField(db_column="boardTemplateID", default=uuid.uuid4, primary_key=True)
    boardid = models.ForeignKey(
        Board, models.CASCADE, db_column="boardID"
    )  # If board is deleted, templates referecing it are also deleted
    title = models.TextField()
    description = models.TextField()

    class Meta:
        db_table = "BoardTemplate"


class TicketEvent(models.Model):
    CREATE = "CREATE"
    DELETE = "DELETE"
    UPDATE = "UPDATE"
    MOVE = "MOVE"
    CHANGE_SCOPE = "CHANGE_SCOPE"
    EVENT_TYPES = [
        (CREATE, "CREATE"),
        (DELETE, "DELETE"),
        (UPDATE, "UPDATE"),
        (MOVE, "MOVE"),
        (CHANGE_SCOPE, "CHANGE_SCOPE"),
    ]

    ticketeventid = models.UUIDField(db_column="ticketEventID", default=uuid.uuid4, primary_key=True)

    # Can't enforce foreign key integrity, because the ticket might have been deleted
    ticketid = models.ForeignKey(Ticket, models.DO_NOTHING, db_column="ticketID", db_constraint=False)

    event_time = models.DateTimeField(default=now)
    event_type = models.CharField(choices=EVENT_TYPES, max_length=6)

    # If column is deleted, all events related to that column are also deleted. This also happens when a board is deleted
    old_columnid = models.ForeignKey(Column, models.CASCADE, db_column="oldColumnId", null=True)
    new_columnid = models.ForeignKey(Column, models.CASCADE, db_column="newColumnId", null=True)

    old_size = models.IntegerField()
    new_size = models.IntegerField()

    old_scopes = models.ManyToManyField("Scope")
    new_scopes = models.ManyToManyField("Scope")

    title = models.TextField()

    class Meta:
        db_table = "TicketEvent"


class Scope(models.Model):
    scopeid = models.UUIDField(db_column="scopeID", primary_key=True)
    boardid = models.ForeignKey(Board, models.CASCADE, db_column="boardID")
    title = models.TextField()
    creation_date = models.DateTimeField(default=now)
    forecast_set_date = models.DateTimeField(blank=True, null=True)
    done_columns = models.ManyToManyField(Column)
    tickets = models.ManyToManyField(Ticket)

    class Meta:
        db_table = "Scope"
