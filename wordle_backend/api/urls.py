from django.urls import path
from .views import DailyWordView, GuessView, GameStateView, GameResetView, StatsView

urlpatterns = [
    path('daily-word/', DailyWordView.as_view(), name='daily-word'),
    path('guess/', GuessView.as_view(), name='submit-guess'),
    path('game-state/<int:pk>/', GameStateView.as_view(), name='game-state'),
    path('game/reset/', GameResetView.as_view(), name='game-reset'),
    path('stats/', StatsView.as_view(), name='user-stats'),
]