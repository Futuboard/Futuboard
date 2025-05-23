# Generated by Django 4.2.9 on 2024-11-19 15:32

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("futuboard", "0006_alter_action_swimlanecolumnid_alter_action_ticketid_and_more"),
    ]

    def give_users_boardid_and_actions_and_tickets(apps, schema_editor):
        User = apps.get_model("futuboard", "User")
        Board = apps.get_model("futuboard", "Board")
        UserGroup = apps.get_model("futuboard", "UserGroup")
        UserGroupUser = apps.get_model("futuboard", "UserGroupUser")
        Column = apps.get_model("futuboard", "Column")
        Action = apps.get_model("futuboard", "Action")
        Ticket = apps.get_model("futuboard", "Ticket")

        for board in Board.objects.all():
            users = {}
            for column in Column.objects.filter(boardid=board):
                for ticket in Ticket.objects.filter(columnid=column):
                    for userGroup in UserGroup.objects.filter(ticketid=ticket.ticketid):
                        for userGroupUser in UserGroupUser.objects.filter(usergroupid=userGroup):
                            user = User.objects.get(pk=userGroupUser.userid.userid)
                            if user.name not in users:
                                users[user.name] = []
                            users[user.name].append(userGroupUser.usergroupid.usergroupid)

                    for action in Action.objects.filter(ticketid=ticket.ticketid):
                        for userGroup in UserGroup.objects.filter(actionid=action.actionid):
                            for userGroupUser in UserGroupUser.objects.filter(usergroupid=userGroup):
                                user = User.objects.get(pk=userGroupUser.userid.userid)
                                if user.name not in users:
                                    users[user.name] = []
                                users[user.name].append(userGroupUser.usergroupid.usergroupid)

            for username, userGroupIds in users.items():
                newUser = User(name=username, boardid=board)
                newUser.save()

                for userGroup in UserGroup.objects.filter(usergroupid__in=userGroupIds):
                    if userGroup.actionid:
                        newUser.actions.add(Action.objects.get(actionid=userGroup.actionid.actionid))
                    if userGroup.ticketid:
                        newUser.tickets.add(Ticket.objects.get(ticketid=userGroup.ticketid.ticketid))

        User.objects.filter(boardid=None).delete()

    operations = [
        migrations.AddField(
            model_name="user",
            name="boardid",
            field=models.ForeignKey(
                db_column="boardID",
                on_delete=django.db.models.deletion.CASCADE,
                to="futuboard.board",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="tickets",
            field=models.ManyToManyField(to="futuboard.ticket"),
        ),
        migrations.AddField(
            model_name="user",
            name="actions",
            field=models.ManyToManyField(to="futuboard.action"),
        ),
        migrations.RunPython(give_users_boardid_and_actions_and_tickets),
        migrations.RemoveField(
            model_name="usergroup",
            name="actionid",
        ),
        migrations.RemoveField(
            model_name="usergroup",
            name="boardid",
        ),
        migrations.RemoveField(
            model_name="usergroup",
            name="ticketid",
        ),
        migrations.AlterUniqueTogether(
            name="usergroupuser",
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name="usergroupuser",
            name="usergroupid",
        ),
        migrations.RemoveField(
            model_name="usergroupuser",
            name="userid",
        ),
        migrations.DeleteModel(
            name="Event",
        ),
        migrations.DeleteModel(
            name="Usergroup",
        ),
        migrations.DeleteModel(
            name="UsergroupUser",
        ),
        migrations.AlterField(
            model_name="user",
            name="boardid",
            field=models.ForeignKey(
                db_column="boardID",
                on_delete=django.db.models.deletion.CASCADE,
                to="futuboard.board",
            ),
        ),
    ]
