import React, { useState, useEffect, useCallback } from 'react';

// Hardcoded list of 5-letter words for the frontend simulation
// In a real application, this would come from the backend.
const WORDS = [
  "APPLE", "BAKER", "CRANE", "DREAM", "EAGLE", "FROST", "GRAPE", "HOUSE", "IGLOO",
  "JUMBO", "KITES", "LEMON", "MOUSE", "NIGHT", "OCEAN", "PLANT", "QUEEN", "RIVER",
  "SMILE", "TRAIN", "UNITY", "VISTA", "WHALE", "YACHT", "ZEBRA", "ABOVE", "BLAST",
  "CHAIR", "DAISY", "EARTH", "FLAME", "GLORY", "HEART", "INDEX", "JAZZY", "KNIFE",
  "LIGHT", "MAGIC", "NOBLE", "OASIS", "PEARL", "QUICK", "ROBOT", "SHINE", "TIGER",
  "ULTRA", "VAPOR", "WAVES", "YIELD", "ZONAL", "CLEAR"
];

// Helper function to get a random word (simulating backend daily word)
const getRandomWord = () => {
  const randomIndex = Math.floor(Math.random() * WORDS.length);
  return WORDS[randomIndex];
};

// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Component for a single letter tile
const Tile = ({ letter, status }) => {
  let tileClass = "tile";
  if (status === 'correct') {
    tileClass += " tile-correct";
  } else if (status === 'present') {
    tileClass += " tile-present";
  } else if (status === 'absent') {
    tileClass += " tile-absent";
  } else if (status === 'filled') {
    tileClass += " tile-filled";
  }
  return (
    <div className={tileClass}>
      {letter}
    </div>
  );
};

// Component for the game board (grid of tiles)
const GameBoard = ({ guesses, currentGuess }) => {
  const board = Array(6).fill(null).map((_, rowIndex) => {
    const rowContent = guesses[rowIndex] || { guess: '', feedback: [] };
    const isCurrentRow = rowIndex === guesses.length && guesses.length < 6;

    const displayLetters = Array(5).fill('');
    const displayStatuses = Array(5).fill('');

    if (isCurrentRow) {
      currentGuess.split('').forEach((char, i) => {
        displayLetters[i] = char.toUpperCase();
        displayStatuses[i] = 'filled';
      });
    } else if (rowContent.guess) {
      rowContent.feedback.forEach((item, i) => {
        displayLetters[i] = item.letter.toUpperCase();
        displayStatuses[i] = item.status;
      });
    }

    return (
      <div key={rowIndex} className="board-row">
        {Array(5).fill(null).map((_, colIndex) => (
          <Tile
            key={colIndex}
            letter={displayLetters[colIndex]}
            status={displayStatuses[colIndex]}
          />
        ))}
      </div>
    );
  });

  return (
    <div className="game-board">
      {board}
    </div>
  );
};

// Component for the on-screen keyboard
const Keyboard = ({ onKeyPress, keyboardStates }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const getKeyClasses = (key) => {
    let keyClass = "key";
    if (key === 'ENTER' || key === 'BACKSPACE') {
      keyClass += " key-wide";
    }

    const state = keyboardStates[key] || '';

    if (state === 'correct') {
      keyClass += " key-correct";
    } else if (state === 'present') {
      keyClass += " key-present";
    } else if (state === 'absent') {
      keyClass += " key-absent";
    }

    return keyClass;
  };

  return (
    <div className="keyboard">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map(key => (
            <button
              key={key}
              className={getKeyClasses(key)}
              onClick={() => onKeyPress(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

// Component for the Header
// Removed onToggleDarkMode and isDarkMode props as dark mode is now permanent
const Header = ({ onStatsClick, onResetClick }) => {
  return (
    <header className="header">
      <button onClick={onStatsClick} className="header-button stats-button">
        Stats
      </button>
      <h1 className="header-title">WORDLE</h1>
      <div className="header-right-buttons">
        {/* Removed Dark Mode Toggle Button */}
        <button onClick={onResetClick} className="header-button new-game-button">
          New Game
        </button>
      </div>
    </header>
  );
};

// Component for the Stats Modal
const StatsModal = ({ show, onClose, stats }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Statistics</h2>
        <div className="stats-grid">
          <div>
            <p className="stat-label">Played</p>
            <p className="stat-value">{stats.gamesPlayed}</p>
          </div>
          <div>
            <p className="stat-label">Win %</p>
            <p className="stat-value">{stats.winRate}%</p>
          </div>
          <div>
            <p className="stat-label">Streak</p>
            <p className="stat-value">{stats.currentStreak}</p>
          </div>
        </div>
        <h3 className="modal-subtitle">Guess Distribution</h3>
        <div className="guess-distribution">
          {Object.entries(stats.guessDistribution).map(([key, value]) => (
            <div key={key} className="dist-row">
              <span className="dist-label">{key}</span>
              <div className="dist-bar-container">
                <div
                  className="dist-bar"
                  style={{ width: `${(value / Math.max(...Object.values(stats.guessDistribution), 1)) * 100}%` }}
                >
                  <span className="dist-value">{value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="modal-close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

// Component for the Game Over Modal
const GameOverModal = ({ show, onClose, won, targetWord, guesses, onNewGame }) => {
  if (!show) return null;

  // Use a fallback for targetWord in case it's undefined
  const displayTargetWord = targetWord || 'UNKNOWN';

  const shareText = `Wordle Clone ${won ? guesses.length : 'X'}/6\n\n` +
    guesses.map(g =>
      g.feedback.map(f => {
        if (f.status === 'correct') return '🟩';
        if (f.status === 'present') return '🟨';
        return '⬛';
      }).join('')
    ).join('\n');

  const handleShare = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText)
        .then(() => alert('Results copied to clipboard!'))
        .catch(err => console.error('Could not copy text: ', err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Results copied to clipboard!');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          {won ? "You Won!" : "Game Over!"}
        </h2>
        {!won && (
          <p className="game-over-word">
            The word was: <span className="game-over-word-highlight">{displayTargetWord}</span>
          </p>
        )}
        <button onClick={handleShare} className="modal-button share-button">
          Share Results
        </button>
        <button
          onClick={() => { onClose(); onNewGame(); }}
          className="modal-button play-again-button"
        >
          Play Again
        </button>
        <button onClick={onClose} className="modal-close-button">
          &times;
        </button>
      </div>
    </div>
  );
};


// Main App Component
const App = () => {
  // Define your backend URL here. Change this if your Django server is on a different host/port.
  const BACKEND_URL = 'http://localhost:8000';

  // Game State
  const [targetWord, setTargetWord] = useState('');
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [keyboardStates, setKeyboardStates] = useState({});
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameId, setGameId] = useState(null); // State for gameId from backend

  // Dark Mode State - Always true, no toggle
  const isDarkMode = true; // Fixed to true

  // Effect to apply dark-mode class to body on initial load
  useEffect(() => {
    document.body.classList.add('dark-mode'); // Always add dark-mode class
  }, []); // Empty dependency array means this runs once on mount


  // User Statistics (persisted in local storage)
  const [stats, setStats] = useState(() => {
    const savedStats = localStorage.getItem('wordleCloneStats');
    return savedStats ? JSON.parse(savedStats) : {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
  });

  // Effect to save stats to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('wordleCloneStats', JSON.stringify(stats));
  }, [stats]);

  const displayMessage = useCallback((msg) => {
    setMessage(msg);
    setShowMessage(true);
    const timer = setTimeout(() => {
      setShowMessage(false);
      setMessage('');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Function to fetch stats from backend
  const fetchStats = useCallback(async () => {
    console.log("Attempting to fetch stats from backend...");
    try {
      const response = await fetch(`${BACKEND_URL}/api/stats/`, { credentials: 'include' });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error fetching stats! Status: ${response.status}, Response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data); // Update stats state with actual backend data
      console.log("Stats fetched successfully:", data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      displayMessage("Failed to load stats. Using local stats. Ensure backend server is running.");
      // No retry for stats, just use local storage if backend is down
    }
  }, [displayMessage]);

  // Game Initialization / Reset
  const initializeGame = useCallback(async () => {
    console.log("Attempting to initialize new game from backend...");
    try {
      // Fetch a new game from the backend
      const response = await fetch(`${BACKEND_URL}/api/daily-word/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // Log the full response for debugging if not OK
        const errorText = await response.text();
        console.error(`Failed to fetch daily word. Status: ${response.status}, Response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // This will be the Game object from Django
      console.log("Received data from /api/daily-word/:", data); // Log the raw data for debugging

      // More robust check for expected data structure
      if (!data || typeof data !== 'object' || !data.target_word || typeof data.target_word !== 'object' || !data.target_word.text || typeof data.id === 'undefined') {
          console.error("Invalid response structure from daily word API. Received:", data);
          throw new Error("Invalid response structure from daily word API.");
      }

      const newWord = data.target_word.text; // The actual word from the backend
      const newGameId = data.id; // The ID of the new game session

      setTargetWord(newWord);
      setGameId(newGameId); // Set the game ID from the backend
      setCurrentGuess('');
      setGuesses([]);
      setGameState('playing');
      setKeyboardStates({});
      setShowGameOverModal(false);
      // Ensure newWord is not undefined before accessing .length
      displayMessage(`New game started! Word has ${newWord ? newWord.length : '??'} letters.`); // Added null check
      console.log("Target Word (from backend):", newWord);
      console.log("New Game ID:", newGameId);
    } catch (error) {
      console.error("Failed to initialize game from backend:", error);
      displayMessage("Failed to connect to backend. Starting offline game. Check backend server and its logs.");
      // Fallback to local word if backend is unreachable
      const localNewWord = getRandomWord();
      setTargetWord(localNewWord);
      setGameId(null); // No backend game ID
      setCurrentGuess('');
      setGuesses([]);
      setGameState('playing');
      setKeyboardStates({});
      setShowGameOverModal(false);
      displayMessage(`Starting offline game! Word has ${localNewWord.length} letters.`);
      console.log("Target Word (offline):", localNewWord);
    }
  }, [displayMessage]);

  useEffect(() => {
    initializeGame();
    fetchStats(); // Fetch stats on initial load
  }, [initializeGame, fetchStats]);

  // Core game logic: check guess and provide feedback (used locally for immediate feedback)
  const checkGuess = useCallback((guess, word) => {
    const feedback = Array(5).fill(null);
    const targetLetters = word.split('');
    const guessLetters = guess.split('');
    const letterCounts = {};

    for (let i = 0; i < targetLetters.length; i++) {
      const char = targetLetters[i];
      letterCounts[char] = (letterCounts[char] || 0) + 1;
    }

    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        feedback[i] = { letter: guessLetters[i], status: 'correct' };
        letterCounts[guessLetters[i]]--;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (feedback[i] === null) {
        const letter = guessLetters[i];
        if (targetLetters.includes(letter) && letterCounts[letter] > 0) {
          feedback[i] = { letter: letter, status: 'present' };
          letterCounts[letter]--;
        } else {
          feedback[i] = { letter: letter, status: 'absent' };
        }
      }
    }
    return feedback;
  }, []);

  // Handle a submitted guess
  const handleSubmitGuess = useCallback(async () => {
    if (currentGuess.length !== 5) {
      displayMessage("Word must be 5 letters long!");
      return;
    }

    const isValidWord = WORDS.includes(currentGuess);
    if (!isValidWord) {
      displayMessage("Not a valid word!");
      return;
    }

    let backendSuccess = false;
    let backendData = null;

    if (gameId) { // Only try to send to backend if we have a gameId
        console.log("Submitting guess to backend:", currentGuess, "for game ID:", gameId);
        try {
            const csrfToken = getCookie('csrftoken'); // Get CSRF token

            const response = await fetch(`${BACKEND_URL}/api/guess/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken, // Include CSRF token in header
                },
                body: JSON.stringify({
                    game_id: gameId, // Send the current game ID
                    guess: currentGuess,
                }),
                credentials: 'include'
            });

            backendData = await response.json();

            if (!response.ok) {
                displayMessage(backendData.detail || "Error submitting guess to backend.");
                console.error("Error response from /api/guess/:", backendData);
            } else {
                backendSuccess = true;
                console.log("Guess submission successful. Backend response:", backendData);
            }
        } catch (error) {
            console.error("Error submitting guess to backend:", error);
            displayMessage("Failed to sync guess with backend. Playing offline.");
        }
    } else {
        displayMessage("Playing offline. Guess not synced with backend.");
    }


    // Always process guess locally for immediate feedback and playability
    const feedback = checkGuess(currentGuess, targetWord);
    const newGuesses = [...guesses, { guess: currentGuess, feedback }];
    setGuesses(newGuesses);

    const newKeyboardStates = { ...keyboardStates };
    feedback.forEach(item => {
        const key = item.letter.toUpperCase();
        if (newKeyboardStates[key] !== 'correct') {
            if (newKeyboardStates[key] !== 'present' || item.status === 'correct') {
                newKeyboardStates[key] = item.status;
            }
        }
    });
    setKeyboardStates(newKeyboardStates);
    setCurrentGuess('');

    // Determine game completion and win/loss based on local state primarily,
    // but use backend data if available and consistent.
    const isWin = feedback.every(f => f.status === 'correct');
    const isCompleted = isWin || newGuesses.length >= 6;

    if (isCompleted) {
        if (isWin) {
            setGameState('won');
            displayMessage("You guessed it!");
        } else {
            setGameState('lost');
            const wordToDisplay = targetWord || 'UNKNOWN'; // Use local targetWord
            displayMessage(`Game Over! The word was ${wordToDisplay}.`);
        }
        setShowGameOverModal(true);

        // Update local stats based on outcome
        setStats(prevStats => {
            const newStats = { ...prevStats };
            newStats.gamesPlayed++;
            if (isWin) {
                newStats.gamesWon++;
                newStats.currentStreak++;
                newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
                newStats.guessDistribution[newGuesses.length]++;
            } else {
                newStats.currentStreak = 0;
            }
            newStats.winRate = Math.round((newStats.gamesWon / newStats.gamesPlayed) * 100);
            return newStats;
        });

        // If backend was successful, also update stats from backend
        if (backendSuccess) {
            fetchStats();
        }
    }
  }, [currentGuess, guesses, gameId, keyboardStates, displayMessage, fetchStats, targetWord, checkGuess, stats, BACKEND_URL]);

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameState !== 'playing') return;
      const key = event.key.toUpperCase();
      if (key === 'BACKSPACE' || key === 'DELETE') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (key === 'ENTER') {
        handleSubmitGuess();
      } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
        if (currentGuess.length < 5) {
          setCurrentGuess(prev => prev + key);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameState, handleSubmitGuess]);

  // Handle on-screen keyboard input
  const handleOnScreenKeyPress = (key) => {
    if (gameState !== 'playing') return;
    if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key);
      }
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <Header
        onStatsClick={() => {
            fetchStats(); // Call the function to fetch and then show modal
            setShowStatsModal(true);
        }}
        onResetClick={initializeGame}
        />

      <main className="main-content">
        {showMessage && (
          <div className="message-box">
            {message}
          </div>
        )}
        <GameBoard guesses={guesses} currentGuess={currentGuess} targetWord={targetWord} />
        <Keyboard onKeyPress={handleOnScreenKeyPress} keyboardStates={keyboardStates} />
      </main>

      <StatsModal
        show={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={stats}
      />

      <GameOverModal
        show={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        won={gameState === 'won'}
        targetWord={targetWord}
        guesses={guesses}
        onNewGame={initializeGame}
      />

      {/* Embedded CSS for styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Global Styles */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');

        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          /* Default to dark mode background and text */
          background-color: #1a1a1b;
          color: #e0e0e0;
        }

        /* Ensure dark-mode class is always on body */
        body.dark-mode {
          background-color: #1a1a1b; /* Dark background */
          color: #e0e0e0; /* Light text */
        }

        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', sans-serif;
          color: #e0e0e0; /* Default app text color to dark mode */
        }

        .app-container.dark-mode {
          color: #e0e0e0; /* Dark mode text */
        }

        /* Header */
        .header {
          width: 100%;
          background-color: #262626; /* Dark mode header */
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* Darker shadow */
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          max-width: 560px;
        }

        /* Removed .header.dark-mode as header is always dark */

        .header-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #e0e0e0; /* Dark mode title */
          letter-spacing: 0.05em;
          margin: 0;
        }

        /* Removed .header.dark-mode .header-title */

        .header-right-buttons {
            display: flex;
            gap: 0.5rem;
        }

        .header-button {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          transition: background-color 0.2s ease-in-out;
          border: none;
          cursor: pointer;
        }

        .stats-button {
          background-color: #3b82f6;
          color: #ffffff;
        }
        .stats-button:hover {
          background-color: #2563eb;
        }

        .new-game-button {
          background-color: #ef4444;
          color: #ffffff;
        }
        .new-game-button:hover {
          background-color: #dc2626;
        }

        /* Removed dark-mode-toggle specific styles as button is removed */

        /* Main Content Area */
        .main-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 560px;
          padding: 1rem;
          position: relative;
        }

        /* Message Box */
        .message-box {
          position: absolute;
          top: 5rem;
          background-color: #4b5563; /* Dark mode message box */
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
          font-size: 1.25rem;
          font-weight: 600;
          z-index: 50;
          animation: fadeInOut 2s ease-in-out forwards;
        }

        /* Removed .dark-mode .message-box */

        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(-20px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }

        /* Game Board */
        .game-board {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
        }

        .board-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .tile {
          width: 3.5rem;
          height: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.875rem;
          font-weight: 700;
          border-radius: 0.5rem;
          transition: all 0.3s ease-in-out;
          border: 2px solid #3a3a3c; /* Dark mode border */
          background-color: #1a1a1b; /* Dark mode default tile background */
          color: #e0e0e0; /* Dark mode default tile text */
        }

        /* Removed .dark-mode .tile */

        .tile-correct {
          background-color: #6aaa64; /* Wordle Green */
          color: #ffffff;
          border-color: #6aaa64;
        }
        .dark-mode .tile-correct { /* Kept for consistency, but now redundant */
          background-color: #538d4e; /* Darker Wordle Green */
          border-color: #538d4e;
        }

        .tile-present {
          background-color: #c9b458;
          color: #ffffff;
          border-color: #c9b458;
        }
        .dark-mode .tile-present { /* Kept for consistency, but now redundant */
          background-color: #b59f3b;
        }

        .tile-absent {
          background-color: #787c7e;
          color: #ffffff;
          border-color: #787c7e;
        }
        .dark-mode .tile-absent { /* Kept for consistency, but now redundant */
          background-color: #3a3a3c;
        }

        .tile-filled {
          background-color: #1a1a1b; /* Dark mode filled */
          color: #e0e0e0;
          border-color: #565758;
        }
        /* Removed .dark-mode .tile-filled */

        /* Keyboard */
        .keyboard {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
        }

        .keyboard-row {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .key {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          font-weight: 700;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease-in-out;
          width: 2.5rem;
          height: 3.5rem;
          font-size: 1.125rem;
          background-color: #565758; /* Dark mode default key */
          color: #e0e0e0;
          border: none;
        }

        /* Removed .dark-mode .key */

        .key:hover {
          background-color: #787c7e; /* Dark mode hover */
        }
        /* Removed .dark-mode .key:hover */

        .key-wide {
          width: 5rem;
          font-size: 0.875rem;
        }

        .key-correct {
          background-color: #6aaa64;
          color: #ffffff;
        }
        .dark-mode .key-correct { /* Kept for consistency, but now redundant */
          background-color: #538d4e;
        }

        .key-present {
          background-color: #c9b458;
          color: #ffffff;
        }
        .dark-mode .key-present { /* Kept for consistency, but now redundant */
          background-color: #b59f3b;
        }

        .key-absent {
          background-color: #787c7e;
          color: #ffffff;
          border-color: #787c7e;
        }
        .dark-mode .key-absent { /* Kept for consistency, but now redundant */
          background-color: #3a3a3c;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 1rem;
        }

        .modal-content {
          background-color: #262626; /* Dark mode modal */
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
          max-width: 28rem;
          width: 100%;
          text-align: center;
          position: relative;
          color: #e0e0e0; /* Dark mode modal text */
        }

        /* Removed .dark-mode .modal-content */

        .modal-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #e0e0e0;
        }
        /* Removed .dark-mode .modal-title */

        .modal-subtitle {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #e0e0e0;
        }
        /* Removed .dark-mode .modal-subtitle */

        .modal-close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 1.875rem;
          color: #9ca3af; /* Dark mode close button */
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }

        .modal-close-button:hover {
          color: #e0e0e0;
        }
        /* Removed .dark-mode .modal-close-button */

        .modal-button {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-size: 1.125rem;
          font-weight: 600;
          transition: background-color 0.2s ease-in-out;
          border: none;
          cursor: pointer;
          margin-top: 1rem;
        }

        .share-button {
          background-color: #3b82f6;
          color: #ffffff;
        }
        .share-button:hover {
          background-color: #2563eb;
        }

        .play-again-button {
          background-color: #16a34a;
          color: #ffffff;
        }
        .play-again-button:hover {
          background-color: #15803d;
        }

        /* Stats Modal Specifics */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }

        .stat-label {
          font-weight: 600;
          color: #a0a0a0; /* Dark mode */
        }
        /* Removed .dark-mode .stat-label */

        .stat-value {
          color: #e0e0e0; /* Dark mode */
        }
        /* Removed .dark-mode .stat-value */

        .guess-distribution {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .dist-row {
          display: flex;
          align-items: center;
        }

        .dist-label {
          width: 2rem;
          text-align: left;
          font-family: monospace;
          font-size: 1.125rem;
        }

        .dist-bar-container {
          flex-grow: 1;
          background-color: #3a3a3c; /* Dark mode */
          height: 1.5rem;
          border-radius: 9999px;
          overflow: hidden;
          margin-left: 0.5rem;
        }
        /* Removed .dark-mode .dist-bar-container */

        .dist-bar {
          background-color: #3b82f6; /* Blue for bars */
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease;
          display: flex;
          align-items: center;
          padding-left: 0.5rem;
        }

        .dist-value {
          color: #ffffff;
          font-size: 0.875rem;
        }

        /* Game Over Modal Specifics */
        .game-over-word {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          color: #a0a0a0; /* Dark mode */
        }
        /* Removed .dark-mode .game-over-word */

        .game-over-word-highlight {
          font-weight: 700;
          color: #16a34a; /* Green highlight */
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .header {
            padding: 0.75rem;
          }
          .header-title {
            font-size: 1.75rem;
          }
          .header-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.875rem;
          }
          .tile {
            width: 3rem;
            height: 3rem;
            font-size: 1.5rem;
          }
          .key {
            width: 2.2rem;
            height: 3.2rem;
            font-size: 1rem;
          }
          .key-wide {
            width: 4.5rem;
            font-size: 0.75rem;
          }
          .modal-content {
            padding: 1.5rem;
          }
          .modal-title {
            font-size: 1.5rem;
          }
          .stats-grid {
            font-size: 1rem;
          }
        }
      `}}></style>
    </div>
  );
};

export default App;
