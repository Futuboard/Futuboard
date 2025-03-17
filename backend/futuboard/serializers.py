from .models import Board, BoardTemplate, Column, Scope, Ticket, TicketEvent, User, Swimlanecolumn, Action
from rest_framework import serializers


class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = [
            "boardid",
            "description",
            "title",
            "creation_date",
            "background_color",
            "default_ticket_title",
            "default_ticket_description",
            "default_ticket_color",
            "default_ticket_size",
            "default_ticket_cornernote",
            "notes",
        ]


class ColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = [
            "columnid",
            "boardid",
            "wip_limit",
            "description",
            "title",
            "ordernum",
            "creation_date",
            "swimlane",
            "wip_limit_story",
        ]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["userid", "name", "boardid", "actions", "tickets"]


class UserSerializerWithoutActionsOrTickets(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["userid", "name"]


class ScopeSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scope
        fields = ["scopeid", "title"]


class TicketSerializer(serializers.ModelSerializer):
    users = UserSerializerWithoutActionsOrTickets(many=True, read_only=True, source="user_set")
    scopes = ScopeSimpleSerializer(many=True, read_only=True, source="scope_set")

    class Meta:
        model = Ticket
        fields = [
            "ticketid",
            "columnid",
            "title",
            "description",
            "color",
            "size",
            "order",
            "creation_date",
            "cornernote",
            "users",
            "scopes",
        ]


class SwimlaneColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Swimlanecolumn
        fields = ["swimlanecolumnid", "columnid", "title", "ordernum"]


class ActionSerializer(serializers.ModelSerializer):
    users = UserSerializerWithoutActionsOrTickets(many=True, read_only=True, source="user_set")

    class Meta:
        model = Action
        fields = ["actionid", "ticketid", "swimlanecolumnid", "title", "order", "creation_date", "users"]


class BoardTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardTemplate
        fields = ["boardtemplateid", "boardid", "title", "description"]


class TicketEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketEvent
        fields = [
            "ticketeventid",
            "ticketid",
            "event_time",
            "event_type",
            "old_columnid",
            "new_columnid",
            "old_size",
            "new_size",
            "old_scopes",
            "new_scopes",
            "title",
        ]


class TicketSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            "ticketid",
            "size",
        ]


class ScopeSerializer(serializers.ModelSerializer):
    done_columns = ColumnSerializer(many=True, read_only=True)
    tickets = TicketSizeSerializer(many=True, read_only=True)
    forecast_tickets = TicketSizeSerializer(many=True, read_only=True)

    class Meta:
        model = Scope
        fields = [
            "scopeid",
            "boardid",
            "title",
            "creation_date",
            "forecast_set_date",
            "forecast_size",
            "forecast_tickets",
            "done_columns",
            "tickets",
        ]
