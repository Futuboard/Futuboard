from .models import Board, Column, Ticket, User, Swimlanecolumn, Action
from rest_framework import serializers


class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ["boardid", "description", "title", "creation_date"]


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


class TicketSerializer(serializers.ModelSerializer):
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
        ]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["userid", "name", "boardid"]


class SwimlaneColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Swimlanecolumn
        fields = ["swimlanecolumnid", "columnid", "title", "ordernum"]


class ActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Action
        fields = ["actionid", "ticketid", "swimlanecolumnid", "title", "order", "creation_date"]
