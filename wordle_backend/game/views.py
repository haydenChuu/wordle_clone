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


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_guess(request):
    """
    POST /api/game/guess/
    
    evaluates guess, updates game state and player stats.
    """
    player = _get_player_for_request(request)
    game_id = request.data.get("game_id")
    guess_raw = request.data.get("guess")

    if not game_id or not guess_raw:
        return Response(
            {"error": "Both 'game_id' and 'guess' are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    guess = str(guess_raw).strip().upper()
    try:
        game = Game.objects.get(id=game_id, player=player)
    except Game.DoesNotExist:
        return Response(
            {"error": "Game not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not game.is_active:
        return Response(
            {"error": "Game is already finished."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(guess) != len(game.target_word):
        return Response(
            {"error": f"Guess must be {len(game.target_word)} letters long."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # enforce guess validity later
    # if guess not in WORD_LIST:
    #     return Response(
    #         {"error": "Invalid word."},
    #         status=status.HTTP_400_BAD_REQUEST
    #     )

    evaluation = evaluate_guess(guess, game.target_word)
    guesses = game.guesses or []
    guesses.append({"guess": guess, "evaluation": evaluation})
    game.guesses = guesses

    is_win = all(letter_info["status"] == "correct" for letter_info in evaluation)
    if is_win:
        game.is_active = False
        game.is_won = True
        game.finished_at = timezone.now()
        game.save()

        player.total_games += 1
        player.wins += 1
        player.total_guesses_in_wins += len(guesses)
        player.save()
    elif len(guesses) >= MAX_GUESSES:
        game.is_active = False
        game.is_won = False
        game.finished_at = timezone.now()
        game.save()

        player.total_games += 1
        player.losses += 1
        player.save()
    else:
        game.save()

    return Response({
        "evaluation": evaluation,
        "guesses": guesses,
        "is_won": game.is_won,
        "is_active": game.is_active,
        "remaining_guesses": MAX_GUESSES - len(guesses)
    },
    status=status.HTTP_200_OK,
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def current_game(request):
    """
    GET /api/game/current/

    Returns the currently active game (if any) for the player.
    """
    player = _get_player_for_request(request)

    game = (
        Game.objects.filter(player=player, is_active=True)
        .order_by("-created_at")
        .first()
    )

    if not game:
        return Response(
            {"active_game": None},
            status=status.HTTP_200_OK,
        )

    serializer = GameSerializer(game)
    remaining_guesses = MAX_GUESSES - len(game.guesses)

    return Response(
        {
            "active_game": serializer.data,
            "remaining_guesses": remaining_guesses,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def player_stats(request):
    """
    GET /api/player/stats/

    Returns aggregated stats for the current player.
    """
    player = _get_player_for_request(request)
    serializer = PlayerStatsSerializer(player)

    return Response(serializer.data, status=status.HTTP_200_OK)

