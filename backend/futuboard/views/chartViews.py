from rest_framework.decorators import api_view
from django.http import JsonResponse


from ..models import Column, TicketEvent
from ..serializers import TicketEventSerializer
import rest_framework.request
from datetime import timedelta, datetime


@api_view(["GET"])
def events(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        columns = Column.objects.filter(boardid=board_id)
        query_set = (
            TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
        ).order_by("event_time")
        serializer = TicketEventSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)


DATE_TIME_FORMAT = "%Y-%m-%dT%H:%M:%S"


@api_view(["GET"])
def cumulative_flow(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        possible_time_units = ["minute", "hour", "day", "week", "month", "year"]
        time_unit = request.query_params.get("time_unit", "day")  # Default to day

        if time_unit not in possible_time_units:
            return JsonResponse({"error": "Invalid time unit"}, status=400)

        time_delta = timedelta(minutes=1)
        if time_unit == "hour":
            time_delta = timedelta(hours=1)
        elif time_unit == "day":
            time_delta = timedelta(days=1)
        elif time_unit == "week":
            time_delta = timedelta(weeks=1)
        elif time_unit == "month":
            time_delta = timedelta(days=30)
        elif time_unit == "year":
            time_delta = timedelta(days=365)

        def round_time(datetime):
            if time_unit == "minute":
                return datetime.replace(second=0, microsecond=0)
            elif time_unit == "hour":
                return datetime.replace(minute=0, second=0, microsecond=0)
            elif time_unit == "day":
                return datetime.replace(hour=0, minute=0, second=0, microsecond=0)
            elif time_unit == "week":
                return datetime.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=datetime.weekday())
            elif time_unit == "month":
                return datetime.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            elif time_unit == "year":
                return datetime.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                raise ValueError("Invalid time unit")

        start_time = request.query_params.get("start_time")
        if start_time is None:
            start_time = datetime.now() - timedelta(days=30)  # Default to last 30 days
        else:
            start_time = datetime.fromisoformat(start_time)

        start_time = round_time(start_time)

        end_time = request.query_params.get("end_time")
        if end_time is None:
            end_time = datetime.now()
        else:
            end_time = datetime.fromisoformat(end_time)

        end_time = round_time(end_time)

        columns = Column.objects.filter(boardid=board_id)
        ticket_events = (
            TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
        ).order_by("event_time")

        if len(ticket_events) == 0:
            return JsonResponse({}, safe=False)

        event_dict = {}

        for event in ticket_events:
            event_time = round_time(event.event_time)
            timestamp = event_time.strftime(DATE_TIME_FORMAT)
            if event_dict.get(timestamp) is None:
                event_dict[timestamp] = [event]
            else:
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

        empty_column_dict = {}
        for column in columns:
            column_name = column_names[str(column.columnid)]
            empty_column_dict[column_name] = 0

        size_at_time = {}

        def setSize(timestamp, columnid, change):
            column_name = column_names[str(columnid)]
            size_at_time[timestamp][column_name] += change

        earliest_event_time = round_time(ticket_events[0].event_time.replace(tzinfo=None))
        time = start_time
        can_have_events_before_start_time = earliest_event_time < start_time
        if can_have_events_before_start_time:
            # Have to start from the earliest event time, not the start time, because otherwise we miss events and the result is wrong
            time = earliest_event_time

        previous_timestamp = None
        while time <= end_time:
            timestamp = time.strftime(DATE_TIME_FORMAT)
            if previous_timestamp is not None:
                size_at_time[timestamp] = size_at_time[previous_timestamp].copy()
            else:
                size_at_time[timestamp] = empty_column_dict.copy()

            events_at_time = event_dict.get(timestamp)

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
            time += time_delta

        if can_have_events_before_start_time:
            # Remove events that happened before the start time
            for timestamp in list(size_at_time.keys()):
                if datetime.fromisoformat(timestamp) < start_time:
                    del size_at_time[timestamp]

        return JsonResponse(size_at_time, safe=False)
