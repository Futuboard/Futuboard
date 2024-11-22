from django.http import Http404
from rest_framework.decorators import api_view
from django.utils import timezone
from django.http import JsonResponse

from ..models import Board, Column, Swimlanecolumn, Action, Ticket, Usergroup, User, UsergroupUser
from ..serializers import SwimlaneColumnSerializer, ActionSerializer, UserSerializer


@api_view(["GET", "POST"])
def swimlanecolumn_view(request, column_id):
    if request.method == "GET":
        try:
            query_set = Swimlanecolumn.objects.filter(columnid=column_id).order_by("ordernum")
            serializer = SwimlaneColumnSerializer(query_set, many=True)
        except Board.DoesNotExist:
            raise Http404("Error getting swimlane columns")
        return JsonResponse(serializer.data, safe=False)
    if request.method == "POST":
        try:
            length = len(Swimlanecolumn.objects.filter(columnid=column_id))
            new_swimlanecolumn = Swimlanecolumn(
                swimlanecolumnid=request.data["swimlanecolumnid"],
                columnid=Column.objects.get(pk=column_id),
                color=request.data["color"],
                title=request.data["title"],
                ordernum=length,
            )

            new_swimlanecolumn.save()
            serializer = SwimlaneColumnSerializer(new_swimlanecolumn)
            return JsonResponse(serializer.data, safe=False)
        except:  # noqa: E722
            raise Http404("Cannot create swinlane column")


@api_view(["GET"])
def get_actions_by_columnId(request, column_id):
    if request.method == "GET":
        try:
            ticketIds_query_set = Ticket.objects.filter(columnid=column_id)
            query_set = Action.objects.filter(ticketid__in=ticketIds_query_set)
            serializer = ActionSerializer(query_set, many=True)
            return JsonResponse(serializer.data, safe=False)
        except:  # noqa: E722
            raise Http404("Column actions not found")


@api_view(["GET", "POST", "PUT"])
def action_view(request, swimlanecolumn_id, ticket_id):
    if request.method == "PUT":
        try:
            actions_data = request.data

            # change action attributes to new swimlanecolumn and ticket
            for action in actions_data:
                action_from_database = Action.objects.get(actionid=action["actionid"])
                action_from_database.ticketid = Ticket.objects.get(pk=ticket_id)
                action_from_database.swimlanecolumnid = Swimlanecolumn.objects.get(pk=swimlanecolumn_id)
                action_from_database.save()

            # update order of actions
            for index, action_data in enumerate(actions_data):
                action = Action.objects.get(actionid=action_data["actionid"])
                action.order = index
                action.save()
            return JsonResponse({"message": "Action order updated successfully"}, status=200)

        except:  # noqa: E722
            raise Http404("Cannot update actions")

    if request.method == "GET":
        try:
            query_set = Action.objects.filter(swimlanecolumnid=swimlanecolumn_id, ticketid=ticket_id).order_by("order")
            serializer = ActionSerializer(query_set, many=True)
        except Board.DoesNotExist:
            raise Http404("Error getting actions")
        return JsonResponse(serializer.data, safe=False)
    if request.method == "POST":
        try:
            length = len(Action.objects.filter(ticketid=ticket_id))
            print(length)
            new_action = Action(
                actionid=request.data["actionid"],
                ticketid=Ticket.objects.get(pk=ticket_id),
                swimlanecolumnid=Swimlanecolumn.objects.get(pk=swimlanecolumn_id),
                title=request.data["title"],
                color=request.data["color"],
                order=length,
                creation_date=timezone.now(),
            )
            new_action.save()

            new_usergroup = Usergroup(actionid=new_action, type="action")
            new_usergroup.save()

            serializer = ActionSerializer(new_action)
            return JsonResponse(serializer.data, safe=False)
        except:  # noqa: E722
            raise Http404("Cannot create action")


@api_view(["PUT"])
def update_swimlanecolumn(request, swimlanecolumn_id):
    try:
        swimlanecolumn = Swimlanecolumn.objects.get(pk=swimlanecolumn_id)
    except Column.DoesNotExist:
        raise Http404("Column not found")

    if request.method == "PUT":
        try:
            swimlanecolumn.title = request.data.get("title", swimlanecolumn.title)
            swimlanecolumn.save()

            serializer = SwimlaneColumnSerializer(swimlanecolumn)
            return JsonResponse(serializer.data, safe=False)
        except:  # noqa: E722
            raise Http404("Cannot update Column")


@api_view(["PUT"])
def update_action(request, action_id):
    if request.method == "PUT":
        try:
            action = Action.objects.get(pk=action_id)
        except Ticket.DoesNotExist:
            raise Http404("Action not found")
        try:
            action.title = request.data.get("title", action.title)
            action.color = request.data.get("color", action.color)
            action.save()

            serializer = ActionSerializer(action)
            return JsonResponse(serializer.data, safe=False)
        except:  # noqa: E722
            raise Http404("Cannot update Action")


@api_view(["GET", "POST", "PUT"])
def get_users_from_action(request, action_id):
    if request.method == "GET":
        try:
            query_set = Usergroup.objects.get(actionid=action_id)
            query_set2 = UsergroupUser.objects.filter(usergroupid=query_set.usergroupid)
            users = [user.userid for user in query_set2]
            serializer = UserSerializer(users, many=True)
        except Board.DoesNotExist:
            raise Http404("Error getting users")
        return JsonResponse(serializer.data, safe=False)
    if request.method == "PUT":
        try:
            usergroup = Usergroup.objects.get(actionid=action_id)
            query_set2 = UsergroupUser.objects.filter(usergroupid=usergroup)
            users = [user.userid for user in query_set2]  # list of users in the new ticket
            if request.data == []:
                query_set2.delete()
            else:
                old_usergroup = UsergroupUser(
                    usergroupid=usergroup, userid=User.objects.get(pk=request.data[0]["userid"])
                )
                old_usergroup.delete()
                for user in request.data:
                    new_usergroup = UsergroupUser(usergroupid=usergroup, userid=User.objects.get(pk=user["userid"]))
                    new_usergroup.save()
        except:  # noqa: E722
            raise Http404("User update failed")
        # TODO: implement
        print("TO BE IMPLEMENTED")
        return JsonResponse({"message": "Users updated successfully"}, status=200)
    if request.method == "POST":
        # when a user is dragged to a ticket for the first time, just create a new one with a new userid but same other fields, makes it easier to delete etc
        try:
            usergroup = Usergroup.objects.get(actionid=action_id)
            new_user = User(name=request.data["name"])
            new_user.save()

            new_UsergroupUser = UsergroupUser(usergroupid=usergroup, userid=new_user)
            new_UsergroupUser.save()

            serializer = UserSerializer(new_user)
            return JsonResponse(serializer.data, safe=False)
        except:  # noqa: E722
            raise Http404("User creation failed")
