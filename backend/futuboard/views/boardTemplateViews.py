import csv
import io
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse

from ..verification import is_admin_password_correct
from ..csv_parser import read_board_data, verify_csv_header, write_board_data, write_csv_header
from ..verification import hash_password
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
        password = request.data["password"]
        board_template = BoardTemplate.objects.get(boardtemplateid=board_template_id)
        board = board_template.boardid

        # Board is copied by exporting and importing the board data to CSV

        csv_file = io.StringIO()
        csv_writer = csv.writer(csv_file)
        write_csv_header(csv_writer)
        write_board_data(csv_writer, board.boardid)

        csv_file.seek(0)  # Reset the file pointer to the beginning of the file
        csv_reader = csv.reader(csv_file, delimiter=",", quotechar='"')

        if not verify_csv_header(csv_reader):
            return JsonResponse({"success": False})

        new_board = read_board_data(csv_reader, request.data["title"], hash_password(password))

        serializer = BoardSerializer(new_board)
        return JsonResponse(serializer.data, safe=False)
