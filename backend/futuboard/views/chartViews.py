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

        data = get_column_story_points_at_times(columns, time_unit, start_time, end_time)

        column_names = change_data_column_ids_to_column_names(data, columns)

        return JsonResponse({"columns": column_names, "data": data}, safe=False)


@api_view(["GET"])
def velocity(request: rest_framework.request.Request, board_id):
    if request.method == "GET":
        columns = Column.objects.filter(boardid=board_id).order_by("ordernum")
        scopes = Scope.objects.filter(boardid=board_id).order_by("title")

        data = get_column_story_points_at_times(columns, "all", scopes=list(scopes.all()))

        data = data[0][1]  # Only one data point for velocity, and we only want the data, not the timestamp

        formatted_data = []

        for scope in scopes:
            scope_id = str(scope.scopeid)
            done_column_ids = [str(column.columnid) for column in scope.done_columns.all()]
            scope_data = data.get(scope_id, {})
            formatted_scope_data = {
                "name": scope.title,
                "forecast": 0,
                "done": 0,
            }
            for column_id in scope_data:
                if column_id in done_column_ids:
                    formatted_scope_data["done"] += scope_data[column_id]

                # TODO ONLY ADD IF WAS IN SCOPE BEFORE FORECAST
                formatted_scope_data["forecast"] += scope_data[column_id]

            formatted_data.append(formatted_scope_data)

        return JsonResponse({"data": formatted_data}, safe=False)


def get_column_story_points_at_times(
    columns, time_unit, start_time=None, end_time=None, scopes=[]
) -> list[tuple[str, dict[str, dict[str, int]]]]:
    ticket_events = (
        TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
    ).order_by("event_time")

    ticket_events_2 = (
        TicketEvent.objects.filter(old_columnid__in=columns) | TicketEvent.objects.filter(new_columnid__in=columns)
    ).order_by("event_time")

    ticket_events_2 = TicketEventSerializer(ticket_events_2, many=True)
    ticket_events_2 = ticket_events_2.data

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

    empty_scope_dict = {}
    scope_ids_with_all = [str(scope.scopeid) for scope in scopes.copy()]
    scope_ids_with_all.append("all")
    for scope_id in scope_ids_with_all:
        empty_scope_dict[scope_id] = {}
        for column in columns:
            empty_scope_dict[scope_id][str(column.columnid)] = 0

    final_data = []

    ticket_scopeids = {}

    def setSize(scope_sizes, columnid, change, ticketid, add_to_all=True):
        scopes_of_ticket = ticket_scopeids.get(ticketid, []).copy()
        if add_to_all:
            scopes_of_ticket.append("all")
        for scope in scopes_of_ticket:
            scope_sizes[scope][str(columnid)] += change

    time = start_time
    can_have_events_before_start_time = earliest_event_time < start_time
    if can_have_events_before_start_time:
        # Have to start from the earliest event time, not the start time, because otherwise we miss events and the result is wrong
        time = earliest_event_time

    time_delta = get_time_delta(time_unit)

    prev_scope_sizes = None
    while time <= end_time:
        timestamp = time.strftime(DATE_TIME_FORMAT)
        scope_sizes = prev_scope_sizes or empty_scope_dict.copy()

        events_at_time = event_dict.get(timestamp)

        if events_at_time is not None:
            for event in events_at_time:
                if event.event_type == TicketEvent.CREATE:
                    setSize(scope_sizes, event.new_columnid.columnid, event.new_size, event.ticketid.ticketid)
                elif event.event_type == TicketEvent.DELETE:
                    setSize(scope_sizes, event.old_columnid.columnid, -event.old_size, event.ticketid.ticketid)
                elif event.event_type == TicketEvent.MOVE:
                    setSize(scope_sizes, event.old_columnid.columnid, -event.old_size, event.ticketid.ticketid)
                    setSize(scope_sizes, event.new_columnid.columnid, event.new_size, event.ticketid.ticketid)
                elif event.event_type == TicketEvent.UPDATE:
                    setSize(
                        scope_sizes,
                        event.new_columnid.columnid,
                        event.new_size - event.old_size,
                        event.ticketid.ticketid,
                    )
                elif event.event_type == TicketEvent.CHANGE_SCOPE:
                    ticket_scopeids[event.ticketid.ticketid] = [str(scope.scopeid) for scope in event.new_scopes.all()]

                    setSize(
                        scope_sizes,
                        event.new_columnid.columnid,
                        event.new_size,
                        event.ticketid.ticketid,
                        add_to_all=False,
                    )

        prev_scope_sizes = scope_sizes.copy()
        time += time_delta
        final_data.append((timestamp, scope_sizes))

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
    elif time_unit == "all":
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
    elif time_unit == "all":  # "all" means we just want a single point in time
        return datetime(2000, 1, 1, 0, 0, 0, 0)
    else:
        raise ValueError("Invalid time unit")


def change_data_column_ids_to_column_names(data, columns):
    column_names = {}

    for column in columns:
        column_name = column.title
        number = 1

        # Handle duplicate column names
        # If column is named "name", it needs to be renamed, because "name"-field is used for the name of the datapoint, i.e. the timestamp
        while column_name in column_names.values() or column_name == "name":
            number += 1
            column_name = column.title + " (" + str(number) + ")"

        column_names[str(column.columnid)] = column_name

    for datapoint in data:
        for column in columns:
            id = str(column.columnid)
            if id in datapoint:
                column_name = column_names[id]
                datapoint[column_name] = datapoint.pop(id)

    return list(column_names.values())
