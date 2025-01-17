import os
import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from .test_utils import addBoard, addBoardTemplate, resetDB


@pytest.mark.django_db
def test_get_board_templates():
    """
    Test getting all board templates
    """
    api_client = APIClient()

    boardid = addBoard().boardid
    addBoardTemplate(boardid)
    addBoardTemplate(boardid)

    response = api_client.get(reverse("board_templates"))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    assert data[0]["boardid"] == str(boardid)
    assert data[1]["boardid"] == str(boardid)
    assert data[0]["title"] == "Template title"
    assert data[1]["title"] == "Template title"
    assert data[0]["description"] == "Template description"
    assert data[1]["description"] == "Template description"

    resetDB()


@pytest.mark.django_db
def test_create_board_template():
    """
    Test creating a board template
    """
    api_client = APIClient()

    boardid = addBoard().boardid

    sent_data = {
        "password": "admin",
        "title": "Template title",
        "description": "Template description",
        "boardid": boardid,
    }

    response = api_client.post(reverse("board_templates"), data=sent_data)
    assert response.status_code == 200
    data = response.json()

    assert data["boardid"] == str(boardid)
    assert data["title"] == sent_data["title"]
    assert data["description"] == sent_data["description"]

    resetDB()


@pytest.mark.django_db
def test_delete_board_template():
    """
    Test deleting a board template
    """
    api_client = APIClient()

    boardid = addBoard().boardid
    board_template = addBoardTemplate(boardid)

    data = {
        "password": "admin",
        "boardtemplateid": board_template.boardtemplateid,
    }

    response = api_client.delete(reverse("board_templates"), data=data)
    assert response.status_code == 200
    assert response.json()["success"] == True

    get_response = api_client.get(reverse("board_templates"))
    assert len(get_response.json()) == 0

    resetDB()


@pytest.mark.django_db
def test_cant_create_board_template_with_wrong_password():
    """
    Test creating a board template
    """
    api_client = APIClient()

    os.environ["ADMIN_PASSWORD"] = "test password"

    boardid = addBoard().boardid

    sent_data = {
        "password": "",
        "title": "Template title",
        "description": "Template description",
        "boardid": boardid,
    }

    response = api_client.post(reverse("board_templates"), data=sent_data)
    assert response.status_code == 401

    get_response = api_client.get(reverse("board_templates"))
    assert len(get_response.json()) == 0

    resetDB()


@pytest.mark.django_db
def test_cant_delete_board_template_with_wrong_password():
    """
    Test deleting a board template
    """
    api_client = APIClient()

    os.environ["ADMIN_PASSWORD"] = "test password"

    boardid = addBoard().boardid
    board_template = addBoardTemplate(boardid)

    data = {
        "password": "wrong password",
        "boardtemplateid": board_template.boardtemplateid,
    }

    response = api_client.delete(reverse("board_templates"), data=data)
    assert response.status_code == 401

    get_response = api_client.get(reverse("board_templates"))
    assert len(get_response.json()) == 1

    resetDB()
