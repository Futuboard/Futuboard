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
    actionid = models.UUIDField(db_column="actionID", primary_key=True)  # Field name made lowercase.
    ticketid = models.ForeignKey(
        "Ticket", models.DO_NOTHING, db_column="ticketID", blank=True, null=True
    )  # Field name made lowercase.
    swimlanecolumnid = models.ForeignKey(
        "Swimlanecolumn", models.DO_NOTHING, db_column="swimlaneColumnID", blank=True, null=True
    )  # Field name made lowercase.
    title = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    order = models.IntegerField()
    creation_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "Action"


class Board(models.Model):
    boardid = models.UUIDField(db_column="boardID", primary_key=True)  # Field name made lowercase.
    description = models.TextField(blank=True, null=True)
    title = models.TextField()
    creator = models.TextField()
    creation_date = models.DateTimeField()
    passwordhash = models.TextField(db_column="passwordHash")  # Field name made lowercase.
    salt = models.TextField()

    class Meta:
        db_table = "Board"


class Column(models.Model):
    columnid = models.UUIDField(db_column="columnID", primary_key=True)  # Field name made lowercase.
    boardid = models.ForeignKey(Board, models.DO_NOTHING, db_column="boardID")  # Field name made lowercase.
    wip_limit = models.IntegerField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    ordernum = models.IntegerField(db_column="orderNum")  # Field name made lowercase.
    creation_date = models.DateTimeField(blank=True, null=True)
    swimlane = models.BooleanField()
    wip_limit_story = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "Column"


class Event(models.Model):
    eventid = models.UUIDField(db_column="eventID", primary_key=True)  # Field name made lowercase.
    boardid = models.ForeignKey(Board, models.DO_NOTHING, db_column="boardID")  # Field name made lowercase.
    timestamp = models.DateTimeField()
    objecttype = models.TextField(db_column="objectType")  # Field name made lowercase.
    objectid = models.UUIDField(db_column="objectID")  # Field name made lowercase.
    action = models.TextField()  # This field type is a guess.

    class Meta:
        db_table = "Event"


class Swimlanecolumn(models.Model):
    swimlanecolumnid = models.UUIDField(
        db_column="swimlaneColumnID", default=uuid.uuid4, primary_key=True
    )  # Field name made lowercase.
    columnid = models.ForeignKey(
        Column, models.DO_NOTHING, db_column="columnID", blank=True, null=True
    )  # Field name made lowercase.
    color = models.TextField(blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    ordernum = models.IntegerField(db_column="orderNum")  # Field name made lowercase.

    class Meta:
        db_table = "SwimlaneColumn"


class Ticket(models.Model):
    ticketid = models.UUIDField(db_column="ticketID", primary_key=True)  # Field name made lowercase.
    columnid = models.ForeignKey(Column, models.DO_NOTHING, db_column="columnID")  # Field name made lowercase.
    title = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    storypoints = models.IntegerField(blank=True, null=True)
    size = models.IntegerField(blank=True, null=True)
    order = models.IntegerField()
    creation_date = models.DateTimeField(blank=True, null=True)
    cornernote = models.TextField(db_column="cornerNote", blank=True, null=True)  # Field name made lowercase.

    class Meta:
        db_table = "Ticket"


class User(models.Model):
    userid = models.UUIDField(db_column="userID", default=uuid.uuid4, primary_key=True)  # Field name made lowercase.
    name = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "User"


class Usergroup(models.Model):
    usergroupid = models.UUIDField(
        db_column="usergroupID", default=uuid.uuid4, primary_key=True
    )  # Field name made lowercase.
    boardid = models.ForeignKey(
        Board, models.DO_NOTHING, db_column="boardID", blank=True, null=True
    )  # Field name made lowercase.
    ticketid = models.ForeignKey(
        Ticket, models.DO_NOTHING, db_column="ticketID", blank=True, null=True
    )  # Field name made lowercase.
    actionid = models.ForeignKey(
        Action, models.DO_NOTHING, db_column="actionID", blank=True, null=True
    )  # Field name made lowercase.
    type = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "UserGroup"


class UsergroupUser(models.Model):
    usergroupuserid = models.UUIDField(default=uuid.uuid4, primary_key=True)
    usergroupid = models.ForeignKey(Usergroup, models.DO_NOTHING, db_column='usergroupID')  # Field name made lowercase. The composite primary key (usergroupID, userID) found, that is not supported. The first column is selected.
    userid = models.ForeignKey(User, models.DO_NOTHING, db_column='userID')  # Field name made lowercase.

    class Meta:
        db_table = 'UserGroup_User'
        unique_together = (('usergroupid', 'userid'))
        
