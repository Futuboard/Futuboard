from .models import Board, BoardTemplate, Column, Ticket, User, Swimlanecolumn, Action
from rest_framework import serializers


class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = [
            "boardid",
            "description",
            "title",
            "creation_date",
            "default_ticket_title",
            "default_ticket_description",
            "default_ticket_color",
            "default_ticket_storypoints",
            "default_ticket_size",
            "default_ticket_cornernote",
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
        fields = ["userid", "name", "actions", "tickets"]


class UserSerializerWithoutActionsOrTickets(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["userid", "name"]


class TicketSerializer(serializers.ModelSerializer):
    users = UserSerializerWithoutActionsOrTickets(many=True, read_only=True, source="user_set")

    class Meta:
        model = Ticket
        fields = [
            "ticketid",
            "columnid",
            "title",
            "description",
            "color",
            "storypoints",
            "size",
            "order",
            "creation_date",
            "cornernote",
            "users",
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
