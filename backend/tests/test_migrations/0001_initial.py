# This migration file is used by test_settings.py to create a test database for the application.

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Board',
            fields=[
                ('boardid', models.UUIDField(db_column='boardID', primary_key=True, serialize=False)),
                ('description', models.TextField(blank=True, null=True)),
                ('title', models.TextField()),
                ('creator', models.TextField()),
                ('creation_date', models.DateTimeField()),
                ('passwordhash', models.TextField(db_column='passwordHash')),
                ('salt', models.TextField()),
            ],
            options={
                'db_table': 'Board',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Column',
            fields=[
                ('columnid', models.UUIDField(db_column='columnID', primary_key=True, serialize=False)),
                ('boardid', models.ForeignKey('Board', models.DO_NOTHING, db_column='boardID')),
                ('wip_limit', models.IntegerField(blank=True, null=True)),
                ('color', models.TextField(blank=True, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('title', models.TextField(blank=True, null=True)),
                ('ordernum', models.IntegerField(db_column='orderNum')),
                ('creation_date', models.DateTimeField(blank=True, null=True)),
                ('swimlane', models.BooleanField()),
                ('wip_limit_story', models.IntegerField(blank=True, null=True)),
            ],
            options={
                'db_table': 'Column',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('eventid', models.UUIDField(db_column='eventID', primary_key=True, serialize=False)),
                ('boardid', models.ForeignKey('Board', models.DO_NOTHING, db_column='boardID')),
                ('timestamp', models.DateTimeField()),
                ('objecttype', models.TextField(db_column='objectType')),
                ('objectid', models.UUIDField(db_column='objectID')),
                ('action', models.TextField()),
            ],
            options={
                'db_table': 'Event',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Swimlanecolumn',
            fields=[
                ('swimlanecolumnid', models.UUIDField(db_column='swimlaneColumnID', default=uuid.uuid4, primary_key=True, serialize=False)),
                ('columnid', models.ForeignKey('Column', models.DO_NOTHING, db_column='columnID', blank=True, null=True)),
                ('color', models.TextField(blank=True, null=True)),
                ('title', models.TextField(blank=True, null=True)),
                ('ordernum', models.IntegerField(db_column='orderNum')),
            ],
            options={
                'db_table': 'SwimlaneColumn',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Ticket',
            fields=[
                ('ticketid', models.UUIDField(db_column='ticketID', primary_key=True, serialize=False)),
                ('columnid', models.ForeignKey('Column', models.DO_NOTHING, db_column='columnID')),
                ('title', models.TextField(blank=True, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('color', models.TextField(blank=True, null=True)),
                ('storypoints', models.IntegerField(blank=True, null=True)),
                ('size', models.IntegerField(blank=True, null=True)),
                ('order', models.IntegerField()),
                ('creation_date', models.DateTimeField(blank=True, null=True)),
                ('cornernote', models.TextField(blank=True, db_column='cornerNote', null=True)),
            ],
            options={
                'db_table': 'Ticket',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('userid', models.UUIDField(db_column='userID', default=uuid.uuid4, primary_key=True, serialize=False)),
                ('name', models.TextField(blank=True, null=True)),
                ('color', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'User',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Action',
            fields=[
                ('actionid', models.UUIDField(db_column='actionID', primary_key=True, serialize=False)),
                ('ticketid', models.ForeignKey('Ticket', models.DO_NOTHING, db_column='ticketID', blank=True, null=True)),
                ('swimlanecolumnid', models.ForeignKey('Swimlanecolumn', models.DO_NOTHING, db_column='swimlaneColumnID', blank=True, null=True)),
                ('title', models.TextField(blank=True, null=True)),
                ('color', models.TextField(blank=True, null=True)),
                ('order', models.IntegerField()),
                ('creation_date', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'Action',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Usergroup',
            fields=[
                ('usergroupid', models.UUIDField(db_column='usergroupID', default=uuid.uuid4, primary_key=True, serialize=False)),
                ('boardid', models.ForeignKey('Board', models.DO_NOTHING, db_column='boardID', blank=True, null=True)),
                ('ticketid', models.ForeignKey('Ticket', models.DO_NOTHING, db_column='ticketID', blank=True, null=True)),
                ('actionid', models.ForeignKey('Action', models.DO_NOTHING, db_column='actionID', blank=True, null=True)),
                ('type', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'UserGroup',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='UsergroupUser',
            fields=[
                ('usergroupid', models.ForeignKey('Usergroup', models.DO_NOTHING, db_column='usergroupID', default=uuid.uuid4)),
                ('userid', models.ForeignKey('User', models.DO_NOTHING, db_column='userID')),
            ],
            options={
                'db_table': 'UserGroup_User',
                'managed': True,
                'unique_together': {('usergroupid', 'userid'),},
            },
        ),
    ]
