import random

from django.contrib.auth import get_user_model
from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .models import Game, PlayerProfile
from .serializers import GameSerializer, PlayerStatsSerializer
from .utils import evaluate_guess
from .word_list import WORD_LIST

MAX_GUESSES = 6

def _get_player_for_request(request):
    """
    Helper function to get or create a PlayerProfile for the authenticated user.
    - if the user is authenticated, use their profile
    - if not authenticated, use or create a guest profile

    Open to change once I actually add in auth
    """

    User = get_user_model()
    if request.user.is_authenticated:
        user = request.user
    else:
        user, _ = User.objects.get_or_create(
            username='guest',
            defaults={'email': "guest@example.com"},
        )
    player, _ = PlayerProfile.objects.get_or_create(user=user)
    return player

@api_view(['POST'])
@permission_classes([AllowAny])
def start_game(request):
    """
    POST /api/game/start/
    
    Starts a new game for the player.
    Deactivites any existing active games.
    """
    player = _get_player_for_request(request)

    # Deactivate any existing active games
    Game.objects.filter(player=player, is_active=True).update(is_active=False, finished_at=timezone.now())

    # Select a random target word
    target_word = random.choice(WORD_LIST).upper()

    # Create a new game
    game = Game.objects.create(player=player, target_word=target_word)

    return Response({
        "game_id": game.id,
        "word_length": len(target_word),
        "max_guesses": MAX_GUESSES
    },
    status=status.HTTP_201_CREATED,
    )

