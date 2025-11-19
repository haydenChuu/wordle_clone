from django.urls import path
from . import views

urlpatterns = [
    path('game/start/', views.start_game, name='start_game'),
    path('game/guess/', views.submit_guess, name='submit_guess'),
    path('game/current/', views.current_game, name='current_game'),
    path('player/stats/', views.player_stats, name='player_stats'),
]