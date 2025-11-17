from rest_framework import serializers
from .models import Game

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'guesses', 'is_active', 'is_won', 'created_at', 'finished_at']

class PlayerStatsSerializer(serializers.Serializer):
    win_ratio = serializers.FloatField(read_only=True)
    average_guesses_per_win = serializers.FloatField(read_only=True)

    class Meta:
        fields = ['total_games', 'wins', 'losses', 'win_ratio', 'average_guesses_per_win']