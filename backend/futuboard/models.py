# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
import uuid


class Action(models.Model):
    actionid = models.UUIDField(db_column="actionID", primary_key=True)
    ticketid = models.ForeignKey("Ticket", models.CASCADE, db_column="ticketID", blank=True, null=True)
    swimlanecolumnid = models.ForeignKey(
        "Swimlanecolumn", models.CASCADE, db_column="swimlaneColumnID", blank=True, null=True
    )
    title = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    order = models.IntegerField()
    creation_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "Action"


class Board(models.Model):
    boardid = models.UUIDField(db_column="boardID", primary_key=True)
    description = models.TextField(blank=True, null=True)
    title = models.TextField()
    creator = models.TextField()
    creation_date = models.DateTimeField()
    passwordhash = models.TextField(db_column="passwordHash")
    salt = models.TextField()

    class Meta:
        db_table = "Board"


class Column(models.Model):
    columnid = models.UUIDField(db_column="columnID", primary_key=True)
    boardid = models.ForeignKey(Board, models.CASCADE, db_column="boardID")
    wip_limit = models.IntegerField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    ordernum = models.IntegerField(db_column="orderNum")
    creation_date = models.DateTimeField(blank=True, null=True)
    swimlane = models.BooleanField()
    wip_limit_story = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "Column"


class Event(models.Model):
    eventid = models.UUIDField(db_column="eventID", primary_key=True)
    boardid = models.ForeignKey(Board, models.DO_NOTHING, db_column="boardID")
    timestamp = models.DateTimeField()
    objecttype = models.TextField(db_column="objectType")
    objectid = models.UUIDField(db_column="objectID")
    action = models.TextField()

    class Meta:
        db_table = "Event"


class Swimlanecolumn(models.Model):
    swimlanecolumnid = models.UUIDField(db_column="swimlaneColumnID", default=uuid.uuid4, primary_key=True)
    columnid = models.ForeignKey(Column, models.CASCADE, db_column="columnID", blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    ordernum = models.IntegerField(db_column="orderNum")

    class Meta:
        db_table = "SwimlaneColumn"


class Ticket(models.Model):
    ticketid = models.UUIDField(db_column="ticketID", primary_key=True)
    columnid = models.ForeignKey(Column, models.CASCADE, db_column="columnID")
    title = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    storypoints = models.IntegerField(blank=True, null=True)
    size = models.IntegerField(blank=True, null=True)
    order = models.IntegerField()
    creation_date = models.DateTimeField(blank=True, null=True)
    cornernote = models.TextField(db_column="cornerNote", blank=True, null=True)

    class Meta:
        db_table = "Ticket"


class User(models.Model):
    userid = models.UUIDField(db_column="userID", default=uuid.uuid4, primary_key=True)
    name = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "User"


class Usergroup(models.Model):
    usergroupid = models.UUIDField(db_column="usergroupID", default=uuid.uuid4, primary_key=True)
    boardid = models.ForeignKey(Board, models.CASCADE, db_column="boardID", blank=True, null=True)
    ticketid = models.ForeignKey(Ticket, models.CASCADE, db_column="ticketID", blank=True, null=True)
    actionid = models.ForeignKey(Action, models.CASCADE, db_column="actionID", blank=True, null=True)
    type = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "UserGroup"


class UsergroupUser(models.Model):
    usergroupuserid = models.UUIDField(default=uuid.uuid4, primary_key=True)
    usergroupid = models.ForeignKey(Usergroup, models.CASCADE, db_column="usergroupID")
    userid = models.ForeignKey(User, models.CASCADE, db_column="userID")

    class Meta:
        db_table = "UserGroup_User"
        unique_together = ("usergroupid", "userid")
