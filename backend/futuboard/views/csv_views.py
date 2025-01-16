"""
Views to import and export CSV files of board data
"""

from django.http import HttpResponse

from ..serializers import BoardSerializer
from ..csv_parser import write_csv_header, write_board_data, verify_csv_header, read_board_data
import csv
import io
from rest_framework.decorators import api_view
from ..verification import hash_password
from django.http import JsonResponse
import json


@api_view(["GET"])
def export_board_data(request, board_id, filename):
    """
    Export board data to a csv file
    """
    if request.method == "GET":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '.csv"'
        writer = csv.writer(response)
        write_csv_header(writer)
        write_board_data(writer, board_id)
        print("Board data exported")
        return response
    return HttpResponse("Invalid request")


@api_view(["POST"])
def import_board_data(request):
    """
    Import board data from a csv file
    """
    if request.method == "POST":
        print(request.data)
        csv_file = request.FILES["file"]
        print(csv_file)
        if not csv_file.name.endswith(".csv"):
            return HttpResponse("Invalid file type", status=400)
        data_set = csv_file.read().decode("UTF-8")
        io_string = io.StringIO(data_set)
        reader = csv.reader(io_string, delimiter=",", quotechar='"')
        if not verify_csv_header(reader):
            return HttpResponse("Invalid file header", status=400)
        board_data = json.loads(request.data["board"])
        board = read_board_data(reader, board_data["title"], hash_password(board_data["password"]))
        serializer = BoardSerializer(board)
        return JsonResponse(serializer.data, safe=False)

    return HttpResponse("Invalid request", status=400)
