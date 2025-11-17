from django.db import models
from django.contrib.auth.models import User

class Game(models.Model):
    target_word = models.CharField(max_length=5)
    guesses = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    is_won = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

class PlayerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    total_games = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    total_guesses_in_wins = models.IntegerField(default=0)

    @property
    def win_ratio(self):
        if self.total_games == 0:
            return 0
        else:
            return self.wins / self.total_games

    @property
    def average_guesses_per_win(self):
        if self.wins == 0:
            return 0
        else:
            return self.total_guesses_in_wins / self.wins
