from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse

from .import_export_views import create_board_from_data_dict, create_data_dict_from_board

from ..verification import is_admin_password_correct
from ..models import Board, BoardTemplate
from ..serializers import BoardTemplateSerializer
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
        data = create_data_dict_from_board(board_template.boardid.boardid)

        # Remove creation_date from data, so new board will have new creation_date:s
        for model in data.values():
            if not isinstance(model, list):
                model = [model]

            for item in model:
                for key in item:
                    if key == "creation_date":
                        del item[key]

        new_board = create_board_from_data_dict(data, request.data["title"], request.data["password"])

        return JsonResponse(new_board, safe=False)
