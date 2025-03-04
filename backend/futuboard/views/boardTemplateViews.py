from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse

from .import_export_views import create_board_from_data_dict, create_data_dict_from_board

from ..verification import hash_password, is_admin_password_correct
from ..models import Board, BoardTemplate
from ..serializers import BoardSerializer, BoardTemplateSerializer
import rest_framework.request


# Create your views here.
@api_view(["GET", "POST", "DELETE"])
def board_templates(request: rest_framework.request.Request):
    if request.method == "GET":
        query_set = BoardTemplate.objects.all()
        serializer = BoardTemplateSerializer(query_set, many=True)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "POST":
        if not is_admin_password_correct(request.data["password"]):
            return HttpResponse(status=401)

        board = Board.objects.get(boardid=request.data["boardid"])
        new_board_template = BoardTemplate(
            title=request.data["title"],
            description=request.data["description"],
            boardid=board,
        )
        new_board_template.save()

        serializer = BoardTemplateSerializer(new_board_template)
        return JsonResponse(serializer.data, safe=False)

    if request.method == "DELETE":
        if not is_admin_password_correct(request.data["password"]):
            return HttpResponse(status=401)
        board_template = BoardTemplate.objects.get(boardtemplateid=request.data["boardtemplateid"])
        board_template.delete()
        return JsonResponse({"success": True})


@api_view(["POST"])
def create_board_from_template(request: rest_framework.request.Request, board_template_id: str):
    if request.method == "POST":
        board_template = BoardTemplate.objects.get(boardtemplateid=board_template_id)

        # Board is copied by exporting and importing the board data
        data = create_data_dict_from_board(board_template.boardid)
        board = create_board_from_data_dict(data, request.data["title"], request.data["password"])

        serializer = BoardSerializer(board)
        return JsonResponse(serializer.data, safe=False)
