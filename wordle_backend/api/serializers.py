from rest_framework import serializers
from .models import Word, Game, Guess, UserStats

class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ['id', 'text', 'difficulty']

class GuessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guess
        fields = ['id', 'guess_text', 'feedback', 'timestamp']

class GameSerializer(serializers.ModelSerializer):
    guesses = GuessSerializer(many=True, read_only=True) # Nested serializer for guesses

    class Meta:
        model = Game
        fields = ['id', 'target_word', 'start_time', 'end_time', 'is_completed', 'is_won', 'attempts', 'guesses']
        read_only_fields = ['target_word', 'start_time', 'end_time', 'is_completed', 'is_won', 'attempts']

class UserStatsSerializer(serializers.ModelSerializer):
    win_rate = serializers.SerializerMethodField()

    class Meta:
        model = UserStats
        fields = ['games_played', 'games_won', 'current_streak', 'max_streak', 'guess_distribution', 'win_rate']

    def get_win_rate(self, obj):
        return obj.calculate_win_rate()