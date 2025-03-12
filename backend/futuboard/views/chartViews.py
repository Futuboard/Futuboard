from rest_framework.decorators import api_view
from django.http import JsonResponse


from ..models import Column, Scope, TicketEvent
from ..serializers import TicketEventSerializer
import rest_framework.request
from datetime import timedelta, datetime
from dateutil.relativedelta import relativedelta

DATE_TIME_FORMAT = "%Y-%m-%dT%H:%M:%S"


@api_view(["GET"])
def events(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        columns = Column.objects.filter(boardid=board_id).order_by("ordernum")
        query_set = (
            TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
        ).order_by("event_time")
        serializer = TicketEventSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET"])
def cumulative_flow(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        possible_time_units = ["minute", "hour", "day", "week", "month", "year"]
        time_unit = request.query_params.get("time_unit", "day")  # Default to day
        start_time = request.query_params.get("start_time")
        end_time = request.query_params.get("end_time")

        if time_unit not in possible_time_units:
            return JsonResponse({"error": "Invalid time unit"}, status=400)

        columns = Column.objects.filter(boardid=board_id).order_by("ordernum")

        data_with_column_ids = get_column_story_points_at_times(columns, time_unit, start_time, end_time)

        (data_with_column_names, column_names) = change_column_ids_to_names(data_with_column_ids, columns)

        return JsonResponse({"columns": column_names, "data": data_with_column_names}, safe=False)


@api_view(["GET"])
def burn_up(request: rest_framework.request.Request, board_id, scope_id):
    if request.method == "GET":
        possible_time_units = ["minute", "hour", "day", "week", "month", "year"]
        time_unit = request.query_params.get("time_unit", "day")  # Default to day
        start_time = request.query_params.get("start_time")
        end_time = request.query_params.get("end_time")

        if time_unit not in possible_time_units:
            return JsonResponse({"error": "Invalid time unit"}, status=400)

        scope = Scope.objects.get(scopeid=scope_id)

        if not scope or scope.boardid.boardid != board_id:
            return JsonResponse({"error": "Invalid scope"}, status=400)

        columns = Column.objects.filter(boardid=board_id).order_by("ordernum")

        data_with_column_ids = get_column_story_points_at_times(columns, time_unit, start_time, end_time, scope_id)

        done_column_ids = [str(column.columnid) for column in scope.done_columns.all()]

        data = []

        for timestamp, column_data in data_with_column_ids:
            scope_size = 0
            done_size = 0
            for column_id in column_data:
                if column_id in done_column_ids:
                    done_size += column_data[column_id]
                scope_size += column_data[column_id]
            data.append({"name": timestamp, "scope": scope_size, "done": done_size})

        return JsonResponse({"data": data}, safe=False)


@api_view(["GET"])
def velocity(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        scopes = Scope.objects.filter(boardid=board_id).order_by("title")

        data = []

        for scope in scopes:
            scope_data = {
                "name": scope.title,
                "forecast": scope.forecast_size or 0,
                "done": 0,
            }

            for done_column in scope.done_columns.all():
                tickets = done_column.ticket_set.filter(scope__in=[scope])
                for ticket in tickets:
                    scope_data["done"] += ticket.size

            data.append(scope_data)

        return JsonResponse({"data": data}, safe=False)


def get_column_story_points_at_times(
    columns, time_unit, start_time=None, end_time=None, scope_id=None
) -> list[tuple[str, dict[str, int]]]:
    ticket_events = (
        TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
    ).order_by("event_time")

    if scope_id is not None:
        ticket_events = ticket_events.filter(old_scopes__in=[scope_id]) | ticket_events.filter(
            new_scopes__in=[scope_id]
        )

    if len(ticket_events) == 0:
        return []

    earliest_event_time = round_time(ticket_events[0].event_time.replace(tzinfo=None), time_unit)

    if start_time is None:
        start_time = earliest_event_time
    else:
        start_time = datetime.fromisoformat(start_time)

    start_time = round_time(start_time, time_unit)

    if end_time is None:
        end_time = datetime.now()
    else:
        end_time = datetime.fromisoformat(end_time)

    end_time = round_time(end_time, time_unit)

    event_dict = {}

    for event in ticket_events:
        event_time = round_time(event.event_time, time_unit)
        timestamp = event_time.strftime(DATE_TIME_FORMAT)
        if event_dict.get(timestamp) is None:
            event_dict[timestamp] = [event]
        else:
            event_dict[timestamp].append(event)

    empty_column_dict = {}

    for column in columns:
        empty_column_dict[str(column.columnid)] = 0

    final_data = []

    def setSize(column_sizes, columnid, change):
        column_sizes[str(columnid)] += change

    time = start_time
    can_have_events_before_start_time = earliest_event_time < start_time
    if can_have_events_before_start_time:
        # Have to start from the earliest event time, not the start time, because otherwise we miss events and the result is wrong
        time = earliest_event_time

    time_delta = get_time_delta(time_unit)

    prev_column_sizes = None
    while time <= end_time:
        timestamp = time.strftime(DATE_TIME_FORMAT)
        column_sizes = prev_column_sizes or empty_column_dict.copy()

        events_at_time = event_dict.get(timestamp)

        if events_at_time is not None:
            for event in events_at_time:
                if event.event_type == TicketEvent.CREATE:
                    setSize(column_sizes, event.new_columnid.columnid, event.new_size)
                elif event.event_type == TicketEvent.DELETE:
                    setSize(column_sizes, event.old_columnid.columnid, -event.old_size)
                elif event.event_type == TicketEvent.MOVE:
                    setSize(column_sizes, event.old_columnid.columnid, -event.old_size)
                    setSize(column_sizes, event.new_columnid.columnid, event.new_size)
                elif event.event_type == TicketEvent.UPDATE:
                    setSize(column_sizes, event.new_columnid.columnid, event.new_size - event.old_size)
                elif event.event_type == TicketEvent.SCOPE_CHANGE:
                    is_in_old_scopes = event.old_scopes.filter(scopeid=scope_id).exists()
                    is_in_new_scopes = event.new_scopes.filter(scopeid=scope_id).exists()
                    if is_in_old_scopes and not is_in_new_scopes:
                        # Scope was removed from ticket
                        setSize(column_sizes, event.old_columnid.columnid, -event.old_size)
                    elif not is_in_old_scopes and is_in_new_scopes:
                        # Scope was added to ticket
                        setSize(column_sizes, event.new_columnid.columnid, event.new_size)

        prev_column_sizes = column_sizes.copy()
        time += time_delta
        final_data.append((timestamp, column_sizes))

    if can_have_events_before_start_time:
        # Only keep events after/on the start time
        final_data = [item for item in final_data if datetime.fromisoformat(item[0]) >= start_time]

    return final_data


def get_time_delta(time_unit):
    time_delta = timedelta(minutes=1)
    if time_unit == "hour":
        time_delta = timedelta(hours=1)
    elif time_unit == "day":
        time_delta = timedelta(days=1)
    elif time_unit == "week":
        time_delta = timedelta(weeks=1)
    elif time_unit == "month":
        time_delta = relativedelta(months=1)
    elif time_unit == "year":
        time_delta = relativedelta(years=1)

    return time_delta


def round_time(date, time_unit):
    if time_unit == "minute":
        return date.replace(second=0, microsecond=0)
    elif time_unit == "hour":
        return date.replace(minute=0, second=0, microsecond=0)
    elif time_unit == "day":
        return date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_unit == "week":
        return date.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=date.weekday())
    elif time_unit == "month":
        return date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif time_unit == "year":
        return date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValueError("Invalid time unit")


def change_column_ids_to_names(data, columns):
    column_names = {}

    new_data = []

    for column in columns:
        column_name = column.title
        number = 1

        # Handle duplicate column names
        # If column is named "name", it needs to be renamed, because "name"-field is used for the name of the datapoint, i.e. the timestamp
        while column_name in column_names.values() or column_name == "name":
            number += 1
            column_name = column.title + " (" + str(number) + ")"

        column_names[str(column.columnid)] = column_name

    for timestamp, column_data in data:
        datapoint = {"name": timestamp}

        for column_id in column_data:
            column_name = column_names[column_id]
            datapoint[column_name] = column_data[column_id]

        new_data.append(datapoint)

    return (new_data, list(column_names.values()))
