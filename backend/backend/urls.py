from django.urls import include, path
from rest_framework import routers
from futuboard.views import views, swimlaneViews, boardViews, csv_views
from django.contrib import admin

router = routers.DefaultRouter()

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("api/boards/", boardViews.get_all_boards, name="get_all_boards"),
    path("api/boards/<uuid:board_id>/", boardViews.get_board_by_id, name="get_board_by_id"),
    path("api/boards/<uuid:board_id>/columns/", views.get_columns_from_board, name="get_columns_from_board"),
    path("api/boards/<uuid:board_id>/columns/<uuid:column_id>/", views.update_column, name="update_column"),
    path(
        "api/boards/<uuid:board_id>/columns/<uuid:column_id>/tickets",
        views.get_tickets_from_column,
        name="get_tickets_from_column",
    ),
    path("api/columns/<uuid:column_id>/tickets/<uuid:ticket_id>/", views.update_ticket, name="update_ticket"),
    path("api/boards/<uuid:board_id>/users/", views.get_users_from_board, name="get_users_from_board"),
    path("api/tickets/<uuid:ticket_id>/users/", views.get_users_from_ticket, name="get_users_from_ticket"),
    path("api/users/<uuid:user_id>", views.update_user, name="update_user"),
    path("api/users/<uuid:user_id>/delete_recursive/", views.delete_user_recursive, name="delete_user_recursive"),
    path("api/tickets/<uuid:ticket_id>/users/", views.get_users_from_ticket, name="get_users_from_ticket"),
    path("api/actions/<uuid:action_id>/users/", swimlaneViews.get_users_from_action, name="get_users_from_action"),
    path(
        "api/columns/<uuid:column_id>/swimlanecolumns/", swimlaneViews.swimlanecolumn_view, name="swimlanecolumn_view"
    ),
    path("api/<uuid:swimlanecolumn_id>/<uuid:ticket_id>/actions/", swimlaneViews.action_view, name="action_view"),
    path("api/actions/<uuid:action_id>/", swimlaneViews.update_action, name="update_action"),
    path(
        "api/swimlanecolumns/<uuid:swimlanecolumn_id>/",
        swimlaneViews.update_swimlanecolumn,
        name="update_swimlanecolumn",
    ),
    path("api/export/<uuid:board_id>/<str:filename>/", csv_views.export_board_data, name="export_board_data"),
    path("api/import/<uuid:board_id>/", csv_views.import_board_data, name="import_board_data"),
]
