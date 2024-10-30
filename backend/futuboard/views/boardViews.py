from django.http import Http404
from rest_framework.decorators import api_view
from django.http import JsonResponse
from ..models import Board, Column, Ticket, Usergroup, UsergroupUser, Swimlanecolumn, Action
from ..serializers import BoardSerializer
import rest_framework.request
from django.utils import timezone
from ..verification import new_password, verify_password


# Create your views here.
@api_view(["GET", "POST"])
def get_all_boards(request: rest_framework.request.Request, format=None):
    if request.method == "POST":
        try:
            new_board = Board(
                boardid=request.data["id"],
                description="",
                title=request.data["title"],
                creator="",
                creation_date=timezone.now(),
                passwordhash=new_password(request.data["password"]),
                salt="",
            )
            new_board.save()

            new_usergroup = Usergroup(boardid=new_board, type="board")
            new_usergroup.save()

            serializer = BoardSerializer(new_board)
            return JsonResponse(serializer.data, safe=False)
        except:
            raise Http404("Cannot create Board")
    if request.method == "GET":
        query_set = Board.objects.all()
        serializer = BoardSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(["GET", "POST", "DELETE"])
def get_board_by_id(request, board_id):
    if request.method == "POST":
        # Get password from request
        password = request.data["password"]
        # Get board from database
        try:
            board = Board.objects.get(pk=board_id)
        except Board.DoesNotExist:
            raise Http404("Board does not exist")
        # verify password
        if verify_password(password, board_id, board.passwordhash):
            return JsonResponse({"success": True})
        else:
            return JsonResponse({"success": False})
    if request.method == "GET":
        try:
            board = Board.objects.get(pk=board_id)
            serializer = BoardSerializer(board)
            return JsonResponse(serializer.data, safe=False)

            # TODO: only return the board if the user is authorized
            # (password is empty of the user has entered the password previously)

            # if verify_password("", board_id, board.passwordhash):
            #     serializer = BoardSerializer(board)
            #     return JsonResponse(serializer.data, safe=False)
            # else:
            #     # return a 401 if the user does not have access to the board
            #     return HttpResponse(status=401)
        except Board.DoesNotExist:
            raise Http404("Board does not exist")
    if request.method == "DELETE":
        try:
            board = Board.objects.get(pk=board_id)
            # delete users in the board.
            usergroup = Usergroup.objects.get(boardid=board.boardid)
            usergroupuser = UsergroupUser.objects.filter(usergroupid=usergroup.usergroupid)
            users = [group.userid for group in usergroupuser]
            for user in users:
                user.delete()

            # delete magnets in tickets and actions.
            columns = Column.objects.filter(boardid=board)
            for column in columns:
                swimlanecolumns = Swimlanecolumn.objects.filter(columnid=column)
                for swimlanecolumn in swimlanecolumns:
                    actions = Action.objects.filter(swimlanecolumnid=swimlanecolumn.swimlanecolumnid)
                    for action in actions:
                        usergroup = Usergroup.objects.get(actionid=action.actionid)
                        usergroupuser = UsergroupUser.objects.filter(usergroupid=usergroup)
                        users = [group.userid for group in usergroupuser]
                        for user in users:
                            user.delete()

                tickets = Ticket.objects.filter(columnid=column)
                for ticket in tickets:
                    usergroup = Usergroup.objects.get(ticketid=ticket.ticketid)
                    usergroupuser = UsergroupUser.objects.filter(usergroupid=usergroup)
                    users = [group.userid for group in usergroupuser]
                    for user in users:
                        user.delete()

            board.delete()
            return JsonResponse({"message": "Board deleted successfully"}, status=200)
        except:
            raise Http404("Board deletion failed")
