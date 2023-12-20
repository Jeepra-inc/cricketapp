from django.urls import path
from . import views

urlpatterns = [
    path('players/', views.players_view, name='players'),
    path('leagues/', views.leagues_view, name='leagues'),
    path('manage_scores/<int:match_id>/', views.manage_scores, name='manage_scores'),
    path('update_inning/<int:match_id>/', views.update_inning, name='update_inning'),
    path('current_match_info/<int:match_id>/', views.current_match_info, name='current_match_info'),
    path('view_stats/<int:match_id>/', views.view_stats, name='view_stats'),
    path('get_bowlers/', views.get_bowlers, name='get_bowlers'),
    path('get_teams/', views.get_teams, name='get_teams'),
    path('get_players/', views.get_players, name='get_players'),
    path('player/<int:player_id>/', views.player_detail, name='player_detail'),
    path('get_admin_player_scoreboard/<int:match_id>/', views.get_admin_player_scoreboard, name='get_admin_player_scoreboard'),
    path('get_bowler_admin_stats/<int:match_id>/', views.get_bowler_admin_stats, name='get_bowler_admin_stats'),
    path('get_live_scorecard_info/<int:match_id>/', views.get_live_scorecard_info, name='get_live_scorecard_info'),
    path('get_total_runs_and_legal_balls/<int:match_id>/', views.get_total_runs_and_legal_balls, name='get_total_runs_and_legal_balls'),
    path('get_live_scores_for_match/<int:match_id>/', views.get_live_scores_for_match, name='get_live_scores_for_match'),
    path('get_opponent_team_bowlers/', views.get_opponent_team_bowlers, name='get_opponent_team_bowlers'),
    path('update_bowler_id/<int:match_id>/', views.update_bowler_id, name='update_bowler_id'),
    path('get_players_without_not_out/<int:match_id>/', views.get_players_without_not_out, name='get_players_without_not_out'),
    path('get_player_partnership/<int:match_id>/', views.get_player_partnership, name='get_player_partnership'),
    path('get_batting_team_stats/<int:match_id>/', views.get_batting_team_stats, name='get_batting_team_stats'),
    path('get_bowler_stats/<int:match_id>/', views.get_bowler_stats, name='get_bowler_stats'),
    path('batting_team_summary/<int:match_id>/', views.batting_team_summary, name='batting_team_summary'),
    path('teams/', views.team_list, name='team_list'),
    path('teams/<int:team_id>/', views.team_detail, name='team_detail'),
    path('teams/<int:team_id>/players/', views.players_page, name='players_page'),



]
