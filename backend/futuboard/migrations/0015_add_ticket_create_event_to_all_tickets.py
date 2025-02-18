from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("futuboard", "0014_alter_boardtemplate_boardid_and_more"),
    ]

    def add_ticket_create_event_for_all_tickets(apps, schema_editor):
        Ticket = apps.get_model("futuboard", "Ticket")
        TicketEvent = apps.get_model("futuboard", "TicketEvent")

        for ticket in Ticket.objects.all():
            columnid = ticket.columnid
            ticketEvent = TicketEvent(
                ticketid=ticket,
                event_type="CREATE",
                old_columnid=None,
                new_columnid=columnid,
                old_size=0,
                new_size=ticket.size,
                title=ticket.title,
                event_time=ticket.creation_date,
            )
            ticketEvent.save()

    operations = [migrations.RunPython(add_ticket_create_event_for_all_tickets)]
