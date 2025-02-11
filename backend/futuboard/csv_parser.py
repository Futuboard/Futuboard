import uuid
from futuboard.models import Board, Column, Ticket, User, Swimlanecolumn, Action
from django.utils import timezone

"""
This file is used to export and import board data to and from a csv file.

The csv file can be used to backup and restore board data.
"""


def nonefy(row):
    # Replace empty strings with None
    for i in range(len(row)):
        if row[i] == "":
            row[i] = None


def write_csv_header(writer):
    """
    Write the header to the csv file, this is used to verify that the csv file is a valid board data file
    """
    writer.writerow(["Futuboard", "v1.0", "Board Data"])
    writer.writerow([])


def verify_csv_header(reader):
    """
    Verify that the csv file has the correct header
    """
    header = next(reader)
    if header[0] != "Futuboard" or header[1] != "v1.0" or header[2] != "Board Data":
        return False
    return True


def write_board_data(writer, boardid):
    # Write board data to the csv file
    board = Board.objects.get(boardid=boardid)
    writer.writerow(["Board", board.description, board.background_color])
    users = User.objects.filter(boardid=boardid)
    # Get userids
    for user in users:
        writer.writerow(["User", user.name])
    writer.writerow(
        [
            "Ticket Template",
            board.default_ticket_title,
            board.default_ticket_description,
            board.default_ticket_size,
            board.default_ticket_storypoints,
            board.default_ticket_cornernote,
            board.default_ticket_color,
        ]
    )
    writer.writerow([])
    # Get all the columns for the board
    columns = Column.objects.filter(boardid=boardid)
    # Write columns with swimlanecolumns first order by swimlane True first
    columns = sorted(columns, key=lambda column: column.swimlane, reverse=True)
    # Write the all the columns to the csv file
    for column in columns:
        # Write the column to the csv file
        writer.writerow(
            [
                "Column",
                column.wip_limit,
                column.description,
                column.title,
                column.ordernum,
                column.swimlane,
            ]
        )
        if column.swimlane:
            # Get all the swimlanecolumns for the column
            swimlanecolumns = Swimlanecolumn.objects.filter(columnid=column.columnid)
            # Write all the swimlanecolumns to the csv file
            for swimlanecolumn in swimlanecolumns:
                writer.writerow(["Swimlanecolumn", swimlanecolumn.title, swimlanecolumn.ordernum])
        # Get all the tickets for the column
        tickets = Ticket.objects.filter(columnid=column.columnid)
        # Write all the tickets in the column to the csv file
        for ticket in tickets:
            writer.writerow(
                [
                    "Ticket",
                    ticket.title,
                    ticket.description,
                    ticket.color,
                    ticket.storypoints,
                    ticket.size,
                    ticket.order,
                    ticket.creation_date,
                    ticket.cornernote,
                ]
            )
            # Get users with ticketid
            users = User.objects.filter(tickets__ticketid=ticket.ticketid)
            for user in users:
                writer.writerow(["User", user.name])
            # Get all the actions for the swimlanecolumn
            actions = Action.objects.filter(ticketid=ticket.ticketid)
            # Write all the actions in the swimlanecolumn to the csv file
            for action in actions:
                column_ordernum = action.swimlanecolumnid.columnid.ordernum

                writer.writerow(
                    [
                        "Action",
                        action.title,
                        action.order,
                        action.swimlanecolumnid.ordernum,
                        column_ordernum,
                    ]
                )
                # Get users with actionid
                users = User.objects.filter(actions__actionid=action.actionid)
                for user in users:
                    writer.writerow(["User", user.name])
        # Split the columns in the csv file with an empty line
        writer.writerow([])
    return writer


def read_board_data(reader, board_title, password_hash):
    """
    Read the board data from the csv file and create the board in the database with new ids for all the objects
    except for board which gets its id from the frontend.
    """
    # Get the board data from the csv file, skip the empty line    board_id = uuid.uuid4()
    next(reader)
    board_data = next(reader)
    board = Board.objects.create(
        title=board_title,
        description=board_data[1],
        background_color=board_data[2] if len(board_data) > 2 else "#FFFFFF",
        passwordhash=password_hash,
        salt="",
        creation_date=timezone.now(),
    )
    # Read board users and template ticket from the csv file
    for row in reader:
        # Replace empty strings with None
        nonefy(row)
        # Read users until the next object type is found
        if len(row) > 0 and row[0] == "User":
            User.objects.create(userid=uuid.uuid4(), name=row[1], boardid=board)
        elif len(row) > 0 and row[0] == "Ticket Template":
            board.default_ticket_title = row[1]
            board.default_ticket_description = row[2]
            board.default_ticket_size = row[3]
            board.default_ticket_storypoints = row[4]
            board.default_ticket_cornernote = row[5]
            board.default_ticket_color = row[6]
            board.save()
        else:
            break

    actions = []

    # Read the columns from the csv file
    row = next(reader, None)
    while row is not None:
        # Empty row = new column
        if len(row) == 0:
            row = next(reader, None)
            continue
        if row[0] == "Column":
            # Replace empty strings with None
            for i in range(len(row)):
                if row[i] == "":
                    row[i] = None
            column = Column.objects.create(
                columnid=uuid.uuid4(),
                boardid=board,
                wip_limit=row[1],
                description=row[2],
                title=row[3],
                ordernum=row[4],
                swimlane=row[5],
            )
            row = next(reader, None)
            # Read the swimlanecolumns from the csv file
            if column.swimlane == "True":
                while len(row) > 0 and row[0] == "Swimlanecolumn":
                    nonefy(row)
                    Swimlanecolumn.objects.create(
                        swimlanecolumnid=uuid.uuid4(), columnid=column, title=row[1], ordernum=row[2]
                    )
                    row = next(reader, None)
            while len(row) > 0 and row[0] == "Ticket":
                # Replace empty strings with None
                nonefy(row)
                ticket = Ticket.objects.create(
                    ticketid=uuid.uuid4(),
                    columnid=column,
                    title=row[1],
                    description=row[2],
                    color=row[3],
                    storypoints=row[4],
                    size=row[5],
                    order=row[6],
                    creation_date=row[7],
                    cornernote=row[8],
                )
                # Read the ticket users from the csv file
                row = next(reader, None)
                while len(row) > 0 and row[0] == "User":
                    nonefy(row)
                    user = User.objects.get(name=row[1], boardid=board)
                    user.tickets.add(ticket)
                    row = next(reader, None)
                # Read the actions from the csv file
                while len(row) > 0 and row[0] == "Action":
                    nonefy(row)
                    action_row = row
                    user_rows = []
                    row = next(reader, None)
                    while len(row) > 0 and row[0] == "User":
                        nonefy(row)
                        user_rows.append(row)
                        row = next(reader, None)

                    if len(row) == 5:
                        actions.append((action_row, ticket, user_rows))
        else:
            row = next(reader, None)

    # Assign actions to swimlanes
    for action in actions:
        column = Column.objects.filter(ordernum=action[0][4], boardid=board).get()
        swimlanecolumn = Swimlanecolumn.objects.filter(columnid=column, ordernum=action[0][3]).get()

        new_action = Action.objects.create(
            actionid=uuid.uuid4(),
            ticketid=action[1],
            title=action[0][1],
            order=action[0][2],
            swimlanecolumnid=swimlanecolumn,
        )

        for user_row in action[2]:
            user = User.objects.get(name=user_row[1], boardid=board)
            user.actions.add(new_action)

    return board
