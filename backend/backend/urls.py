from django.urls import include, path
from rest_framework import routers
from futuboard.views import views, swimlaneViews, boardViews, csv_views, boardTemplateViews
from django.contrib import admin

router = routers.DefaultRouter()

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("api/boards/", boardViews.all_boards, name="all_boards"),
    path("api/boards/<uuid:board_id>/", boardViews.board_by_id, name="board_by_id"),
    path("api/boards/<uuid:board_id>/title/", boardViews.update_board_title, name="update_board_title"),
    path("api/boards/<uuid:board_id>/password/", boardViews.update_board_password, name="update_board_password"),
    path("api/boards/<uuid:board_id>/columns/", views.columns_on_board, name="columns_on_board"),
    path("api/boards/<uuid:board_id>/columns/<uuid:column_id>/", views.update_column, name="update_column"),
    path(
        "api/boards/<uuid:board_id>/columns/<uuid:column_id>/tickets",
        views.tickets_on_column,
        name="tickets_on_column",
    ),
    path("api/columns/<uuid:column_id>/tickets/<uuid:ticket_id>/", views.update_ticket, name="update_ticket"),
    path("api/boards/<uuid:board_id>/users/", views.users_on_board, name="users_on_board"),
    path("api/tickets/<uuid:ticket_id>/users/", views.users_on_ticket, name="users_on_ticket"),
    path("api/users/<uuid:user_id>", views.update_user, name="update_user"),
    path("api/tickets/<uuid:ticket_id>/users/", views.users_on_ticket, name="users_on_ticket"),
    path("api/actions/<uuid:action_id>/users/", swimlaneViews.users_on_action, name="users_on_action"),
    path(
        "api/columns/<uuid:column_id>/swimlanecolumns/",
        swimlaneViews.swimlanecolumns_on_column,
        name="swimlanecolumns_on_column",
    ),
    path(
        "api/<uuid:swimlanecolumn_id>/<uuid:ticket_id>/actions/",
        swimlaneViews.action_on_swimlane,
        name="action_on_swimlane",
    ),
    path("api/actions/<uuid:action_id>/", swimlaneViews.update_action, name="update_action"),
    path(
        "api/swimlanecolumns/<uuid:swimlanecolumn_id>/",
        swimlaneViews.update_swimlanecolumn,
        name="update_swimlanecolumn",
    ),
    path(
        "api/columns/<uuid:column_id>/actions/", swimlaneViews.get_actions_by_columnId, name="get_actions_by_columnId"
    ),
    path("api/export/<uuid:board_id>/<str:filename>/", csv_views.export_board_data, name="export_board_data"),
    path("api/import/", csv_views.import_board_data, name="import_board_data"),
    path("api/boardtemplates/", boardTemplateViews.board_templates, name="board_templates"),
    path(
        "api/boardtemplates/<uuid:board_template_id>/",
        boardTemplateViews.create_board_from_template,
        name="create_board_from_template",
    ),
    path("api/checkadminpassword/", views.check_admin_password, name="check_admin_password"),
]
