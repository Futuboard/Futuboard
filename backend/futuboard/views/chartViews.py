from rest_framework.decorators import api_view
from django.http import JsonResponse


from ..models import Column, TicketEvent
from ..serializers import TicketEventSerializer
import rest_framework.request
from datetime import timedelta


@api_view(["GET"])
def events(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        columns = Column.objects.filter(boardid=board_id)
        query_set = (
            TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
        ).order_by("event_time")
        serializer = TicketEventSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET"])
def cumulative_flow(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        columns = Column.objects.filter(boardid=board_id)
        ticket_events = (
            TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
        ).order_by("event_time")

        if len(ticket_events) == 0:
            return JsonResponse({}, safe=False)

        time_unit = "minute"
        start_time = ticket_events.first().event_time  # type: ignore
        end_time = ticket_events.last().event_time  # type: ignore

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

        column_names = {}

        for column in columns:
            column_name = column.title
            number = 1
            # Handle duplicate column names
            while column_name in column_names.values():
                number += 1
                column_name = column.title + " (" + str(number) + ")"

            column_names[str(column.columnid)] = column_name

        time = start_time
        empty_column_dict = {}
        for column in columns:
            column_name = column_names[str(column.columnid)]
            empty_column_dict[column_name] = 0

        size_at_time = {}

        def setSize(timestamp, columnid, change):
            column_name = column_names[str(columnid)]
            size_at_time[timestamp][column_name] += change

        previous_timestamp = None
        while time <= end_time:
            timestamp = time.isoformat()
            if previous_timestamp is not None:
                size_at_time[timestamp] = size_at_time[previous_timestamp].copy()
            else:
                size_at_time[timestamp] = empty_column_dict.copy()

            events_at_time = event_dict.get(time.isoformat())

            if events_at_time is not None:
                for event in events_at_time:
                    if event.event_type == TicketEvent.CREATE:
                        setSize(timestamp, event.new_columnid.columnid, event.new_size)
                    elif event.event_type == TicketEvent.DELETE:
                        setSize(timestamp, event.old_columnid.columnid, -event.old_size)
                    elif event.event_type == TicketEvent.MOVE:
                        setSize(timestamp, event.old_columnid.columnid, -event.old_size)
                        setSize(timestamp, event.new_columnid.columnid, event.new_size)
                    elif event.event_type == TicketEvent.UPDATE:
                        setSize(timestamp, event.new_columnid.columnid, event.new_size - event.old_size)

            previous_timestamp = timestamp
            time += timedelta(minutes=1)

        return JsonResponse(size_at_time, safe=False)
