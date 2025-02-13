from rest_framework.decorators import api_view
from django.http import JsonResponse


from ..models import Column, TicketEvent
from ..serializers import TicketEventSerializer
import rest_framework.request
from datetime import timedelta

# import the logging library
import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)


@api_view(["GET"])
def events(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        columns = Column.objects.filter(boardid=board_id)
        query_set = TicketEvent.objects.filter(old_columnid__in=columns)
        serializer = TicketEventSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET"])
def cumulative_flow(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        columns = Column.objects.filter(boardid=board_id)
        ticket_events = TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(
            new_columnid__in=columns
        )
        if len(ticket_events) == 0:
            return JsonResponse(["bruh"], safe=False)

        time_unit = "minute"
        start_time = ticket_events.first().event_time
        end_time = ticket_events.last().event_time

        event_dict = {}

        if time_unit == "minute":
            start_time = start_time.replace(second=0, microsecond=0)
            end_time = end_time.replace(second=0, microsecond=0) + timedelta(minutes=1)
            for event in ticket_events:
                event_time = event.event_time.replace(second=0, microsecond=0)
                timestamp = event_time.isoformat()
                if event_dict.get(timestamp) is None:
                    event_dict[timestamp] = []

                event_dict[timestamp].append(event)

        time = start_time
        column_dict = {}
        for column in columns:
            column_dict[str(column.columnid)] = 0

        final_dict = {}

        previous_timestamp = None
        while time <= end_time:
            timestamp = time.isoformat()
            if previous_timestamp is not None:
                final_dict[timestamp] = final_dict[previous_timestamp].copy()
            else:
                final_dict[timestamp] = column_dict.copy()

            events_at_time = event_dict.get(time.isoformat())

            if events_at_time is not None:
                for event in events_at_time:
                    if event.event_type == TicketEvent.CREATE:
                        final_dict[timestamp][str(event.new_columnid.columnid)] += event.new_size
                    elif event.event_type == TicketEvent.DELETE:
                        final_dict[timestamp][str(event.old_columnid.columnid)] -= event.old_size
                    elif event.event_type == TicketEvent.MOVE:
                        final_dict[timestamp][str(event.old_columnid.columnid)] -= event.old_size
                        final_dict[timestamp][str(event.new_columnid.columnid)] += event.new_size
                    elif event.event_type == TicketEvent.UPDATE:
                        final_dict[timestamp][str(event.new_columnid.columnid)] += event.new_size - event.old_size

            previous_timestamp = timestamp
            time += timedelta(minutes=1)

        return JsonResponse(final_dict, safe=False)
