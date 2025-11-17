from django.urls import path
from . import views

urlpatterns = [
    path('game/start/', views.start_game),
    path('game/guess/', views.submit_guess),
    path('player/stats/', views.player_stats),
]