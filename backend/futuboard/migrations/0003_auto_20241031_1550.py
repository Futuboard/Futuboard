# Generated by Django 4.2.9 on 2024-10-31 13:50


from django.db import migrations
import uuid


def gen_uuid(apps, schema_editor):
    MyModel = apps.get_model("futuboard", "usergroupuser")
    for row in MyModel.objects.all():
        row.usergroupuserid = uuid.uuid4()
        row.save(update_fields=["usergroupuserid"])


class Migration(migrations.Migration):
    dependencies = [
        ("futuboard", "0002_usergroupuser_usergroupuserid_and_more"),
    ]

    operations = [
        # omit reverse_code=... if you don't want the migration to be reversible.
        migrations.RunPython(gen_uuid, reverse_code=migrations.RunPython.noop),
    ]