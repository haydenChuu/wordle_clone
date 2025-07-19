from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny # <--- ADD THIS IMPORT
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
import random

from .models import Word, Game, Guess, UserStats
from .serializers import WordSerializer, GameSerializer, GuessSerializer, UserStatsSerializer

# Helper function for game logic (similar to frontend's checkGuess)
def get_guess_feedback(guess_text, target_word_text):
    feedback = []
    target_letters = list(target_word_text)
    guess_letters = list(guess_text)
    letter_counts = {}

    for char in target_letters:
        letter_counts[char] = letter_counts.get(char, 0) + 1

    # First pass: Mark 'correct' letters
    for i in range(5):
        if guess_letters[i] == target_letters[i]:
            feedback.append({"letter": guess_letters[i], "status": "correct"})
            letter_counts[guess_letters[i]] -= 1
        else:
            feedback.append(None) # Placeholder

    # Second pass: Mark 'present' and 'absent' letters
    for i in range(5):
        if feedback[i] is None:
            letter = guess_letters[i];
            if letter in letter_counts and letter_counts[letter] > 0:
                feedback[i] = {"letter": letter, "status": "present"}
                letter_counts[letter] -= 1
            else:
                feedback[i] = {"letter": letter, "status": "absent"}
    return feedback

class DailyWordView(APIView):
    """
    GET: Get metadata for a new random 5-letter word for a game.
    This replaces the "daily word" concept with an "unlimited plays" model.
    """
    def get(self, request, *args, **kwargs):
        # Get a random 5-letter word
        words = Word.objects.all()
        if not words.exists():
            return Response({"detail": "No words available in the database."}, status=status.HTTP_404_NOT_FOUND)
        random_word = random.choice(words)

        # Create a new game session
        user = request.user if request.user.is_authenticated else None
        game = Game.objects.create(user=user, target_word=random_word)

        serializer = GameSerializer(game)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class GuessView(APIView):
    """
    POST: Submit a guess for the current game.
    """
    permission_classes = [AllowAny] # <--- ADD THIS LINE TO ALLOW UNATHENTICATED POSTS
    def post(self, request, *args, **kwargs):
        game_id = request.data.get('game_id')
        guess_text = request.data.get('guess', '').upper()

        if not game_id:
            return Response({"detail": "Game ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        game = get_object_or_404(Game, id=game_id)

        if game.is_completed:
            return Response({"detail": "Game is already completed."}, status=status.HTTP_400_BAD_REQUEST)

        if len(guess_text) != 5 or not guess_text.isalpha():
            return Response({"detail": "Guess must be a 5-letter English word."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate if the guess itself is a known valid word (optional, but good practice)
        if not Word.objects.filter(text=guess_text).exists():
             return Response({"detail": "Not a valid word in our dictionary."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            game.attempts += 1
            feedback = get_guess_feedback(guess_text, game.target_word.text)
            Guess.objects.create(game=game, guess_text=guess_text, feedback=feedback)

            is_win = all(item['status'] == 'correct' for item in feedback)
            if is_win:
                game.is_won = True
                game.is_completed = True
                game.end_time = timezone.now()
                self._update_user_stats(game.user, True, game.attempts)
            elif game.attempts >= 6:
                game.is_completed = True
                game.end_time = timezone.now()
                self._update_user_stats(game.user, False, game.attempts)
            game.save()

            serializer = GameSerializer(game)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def _update_user_stats(self, user, won, attempts):
        if user and user.is_authenticated:
            stats, created = UserStats.objects.get_or_create(user=user)
            stats.games_played += 1
            if won:
                stats.games_won += 1
                stats.current_streak += 1
                stats.max_streak = max(stats.max_streak, stats.current_streak)
                guess_count_str = str(attempts)
                stats.guess_distribution[guess_count_str] = stats.guess_distribution.get(guess_count_str, 0) + 1
            else:
                stats.current_streak = 0
            stats.save()

class GameStateView(generics.RetrieveAPIView):
    """
    GET: Retrieve current game progress by game ID.
    """
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    lookup_field = 'pk' # Use 'pk' for game ID

class GameResetView(APIView):
    """
    POST: Reset/start a new game.
    """
    def post(self, request, *args, **kwargs):
        user = request.user if request.user.is_authenticated else None
        # Get a new random word for the new game
        words = Word.objects.all()
        if not words.exists():
            return Response({"detail": "No words available in the database."}, status=status.HTTP_404_NOT_FOUND)
        random_word = random.choice(words)

        game = Game.objects.create(user=user, target_word=random_word)
        serializer = GameSerializer(game)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class StatsView(APIView):
    """
    GET: Get user statistics.
    """
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            # For anonymous users, return default stats or an empty object
            return Response({
                "games_played": 0, "games_won": 0, "win_rate": 0,
                "current_streak": 0, "max_streak": 0, "guess_distribution": {}
            }, status=status.HTTP_200_OK)

        stats, created = UserStats.objects.get_or_create(user=request.user)
        serializer = UserStatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)