from django.db import models
from django.contrib.auth.models import User # Or a custom user model

class Word(models.Model):
    """Stores valid 5-letter words."""
    text = models.CharField(max_length=5, unique=True)
    difficulty = models.IntegerField(default=1) # e.g., 1-5

    def __str__(self):
        return self.text

class Game(models.Model):
    """Tracks individual game sessions."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    target_word = models.ForeignKey(Word, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    is_won = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0) # Number of guesses made

    def __str__(self):
        return f"Game {self.id} for {self.user.username if self.user else 'Anonymous'} - Word: {self.target_word.text}"

class Guess(models.Model):
    """Stores each guess attempt with results."""
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='guesses')
    guess_text = models.CharField(max_length=5)
    feedback = models.JSONField() # Stores [{"letter": "A", "status": "correct"}, ...]
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Guess '{self.guess_text}' in Game {self.game.id}"

class UserStats(models.Model):
    """Aggregates user performance data."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    max_streak = models.IntegerField(default=0)
    # Store guess distribution as JSONField or separate model if complex
    guess_distribution = models.JSONField(default=dict) # e.g., {"1": 0, "2": 0, ..., "6": 0}

    def __str__(self):
        return f"Stats for {self.user.username}"

    def calculate_win_rate(self):
        if self.games_played == 0:
            return 0
        return round((self.games_won / self.games_played) * 100)