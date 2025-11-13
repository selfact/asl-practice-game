document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTS ---
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const NUMBERS = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
    const SIGNS = [
        ...ALPHABET.map(char => ({ id: char, image: `images/${char.toLowerCase()}.png`, type: 'letter' })),
        ...NUMBERS.map(num => ({ id: num, image: `images/${num}.png`, type: 'number' })),
    ];
    const GAME_MODES = [
        { id: 'FlashMatch', title: 'Flash Match', description: 'A letter or number is shown. Pick the correct sign!' },
        { id: 'GuessTheSign', title: 'Guess the Sign', description: 'An image of a sign is shown. Guess the correct letter or number.' },
        { id: 'Memory', title: 'Memory Cards', description: 'Classic memory flip game with ASL signs.' },
        { id: 'SpeedRound', title: 'Speed Round', description: 'Identify as many signs as you can in 60 seconds!' },
    ];
    const LOCAL_STORAGE_KEY = 'asl-practice-scores';
    const INITIAL_SCORES = { FlashMatch: 0, GuessTheSign: 0, Memory: 0, SpeedRound: 0 };

    // --- STATE ---
    let state = {
        scores: { ...INITIAL_SCORES },
        currentView: 'menu',
        currentGameMode: null,
        gameTimer: null,
    };

    // --- DOM ELEMENTS ---
    const views = {
        menu: document.getElementById('view-menu'),
        game: document.getElementById('view-game'),
        reference: document.getElementById('view-reference'),
    };
    const gameModesContainer = document.getElementById('game-modes-container');
    const scoreboardContainer = document.getElementById('scoreboard-container');

    // --- UTILITY FUNCTIONS ---
    // Fisher-Yates shuffle for better randomness
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };
    const saveScores = () => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.scores));
    const loadScores = () => {
        try {
            const storedScores = localStorage.getItem(LOCAL_STORAGE_KEY);
            state.scores = storedScores ? JSON.parse(storedScores) : { ...INITIAL_SCORES };
        } catch (error) {
            console.error('Failed to load scores from localStorage:', error);
            state.scores = { ...INITIAL_SCORES };
        }
    };

    // --- NAVIGATION & VIEW RENDERING ---
    const navigate = (view, gameMode = null) => {
        state.currentView = view;
        state.currentGameMode = gameMode;
        render();
    };

    const render = () => {
        // Hide all views
        Object.values(views).forEach(view => view.classList.add('hidden'));
        // Show current view
        if (views[state.currentView]) {
            views[state.currentView].classList.remove('hidden');
        }

        switch (state.currentView) {
            case 'menu':
                renderMenu();
                break;
            case 'game':
                renderGame();
                break;
            case 'reference':
                renderReferenceChart();
                break;
        }
    };

    // --- MENU VIEW ---
    const renderMenu = () => {
        // Render game mode cards
        gameModesContainer.innerHTML = GAME_MODES.map(mode => `
            <div class="card game-card">
                <h3>${mode.title}</h3>
                <p>${mode.description}</p>
                <button class="btn btn-primary" data-mode="${mode.id}">Play Now</button>
            </div>
        `).join('') + `
            <div class="card game-card">
                <h3>Reference Chart</h3>
                <p>Need a refresher? View all the signs here.</p>
                <button id="show-reference-btn" class="btn btn-secondary">View Chart</button>
            </div>`;
        
        renderScoreboard();

        // Add event listeners
        gameModesContainer.querySelectorAll('[data-mode]').forEach(btn => 
            btn.addEventListener('click', () => navigate('game', btn.dataset.mode))
        );
        document.getElementById('show-reference-btn').addEventListener('click', () => navigate('reference'));
    };

    const renderScoreboard = () => {
        scoreboardContainer.innerHTML = `
            <div class="card">
                <h2 style="text-align: center; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700;">Scoreboard</h2>
                <div class="scoreboard-grid">
                    ${GAME_MODES.map(mode => `
                        <div class="scoreboard-item">
                            <p>${mode.title}</p>
                            <p>${state.scores[mode.id] || 0}</p>
                        </div>
                    `).join('')}
                </div>
                <button id="reset-scores-btn" class="btn btn-danger w-full">Reset All Scores</button>
            </div>
        `;
        document.getElementById('reset-scores-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all scores?')) {
                state.scores = { ...INITIAL_SCORES };
                saveScores();
                renderScoreboard();
            }
        });
    };

    // --- REFERENCE CHART VIEW ---
    const renderReferenceChart = () => {
        const letters = SIGNS.filter(s => s.type === 'letter');
        const numbers = SIGNS.filter(s => s.type === 'number');
        views.reference.innerHTML = `
            <div class="card">
                <div class="reference-header">
                    <h2>ASL Reference Chart</h2>
                    <button id="back-to-menu-ref" class="btn btn-secondary">Back to Menu</button>
                </div>
                <section class="reference-section">
                    <h3>Alphabet (A-Z)</h3>
                    <div class="reference-grid">
                        ${letters.map(s => `<div class="reference-item"><img src="${s.image}" alt="ASL for ${s.id}"><span>${s.id}</span></div>`).join('')}
                    </div>
                </section>
                <section class="reference-section" style="margin-top: 2rem;">
                    <h3>Numbers (1-20)</h3>
                    <div class="reference-grid">
                        ${numbers.map(s => `<div class="reference-item"><img src="${s.image}" alt="ASL for ${s.id}"><span>${s.id}</span></div>`).join('')}
                    </div>
                </section>
            </div>`;
        document.getElementById('back-to-menu-ref').addEventListener('click', () => navigate('menu'));
    };

    // --- GAME VIEW ---
    const renderGame = () => {
        if (!state.currentGameMode) return;
        if (state.currentGameMode === 'Memory') {
            initMemoryGame();
        } else {
            initGuessingGame();
        }
    };
    
    const showGameOver = (score, message = '') => {
        const mode = state.currentGameMode;
        const totalScore = state.scores[mode];
        views.game.innerHTML = `
        <div class="card game-over-modal">
            <h2>${message || "Game Over!"}</h2>
            <p>You scored <span>${score}</span> points this round.</p>
            <p>Total score for ${GAME_MODES.find(m => m.id === mode).title}: <span>${totalScore}</span></p>
            <div class="game-over-actions">
                <button id="play-again-btn" class="btn btn-primary">Play Again</button>
                <button id="back-to-menu-game" class="btn btn-secondary">Back to Menu</button>
            </div>
        </div>`;
        document.getElementById('play-again-btn').addEventListener('click', renderGame);
        document.getElementById('back-to-menu-game').addEventListener('click', () => navigate('menu'));
    };

    // --- GUESSING & SPEED ROUND LOGIC ---
    let guessingGameState = {};
    const initGuessingGame = () => {
        const mode = state.currentGameMode;
        guessingGameState = {
            currentSign: null,
            options: [],
            isAnswered: false,
            score: 0,
            timeLeft: 60,
        };
        
        views.game.innerHTML = `
            <div class="game-container card">
                <div class="game-header">
                    <h2 id="game-title"></h2>
                    <button id="exit-game-btn" class="btn btn-ghost">Exit</button>
                </div>
                <div class="game-stats">
                    <div>Score: <span id="current-score">${state.scores[mode]}</span></div>
                    ${mode === 'SpeedRound' ? `<div>Time: <span id="time-left">${guessingGameState.timeLeft}</span></div>` : ''}
                </div>
                <div class="sign-display">
                    <img id="sign-image" src="" alt="ASL Sign">
                    <div id="sign-text" class="sign-display-text hidden"></div>
                    <div id="feedback-overlay" class="feedback-overlay hidden"></div>
                </div>
                <div id="options-container" class="options-grid"></div>
            </div>`;
        
        document.getElementById('exit-game-btn').addEventListener('click', () => navigate('menu'));
        document.getElementById('game-title').textContent = GAME_MODES.find(m => m.id === mode).title;

        nextQuestion();

        if (mode === 'SpeedRound') {
            state.gameTimer = setInterval(() => {
                guessingGameState.timeLeft--;
                document.getElementById('time-left').textContent = guessingGameState.timeLeft;
                if (guessingGameState.timeLeft <= 0) {
                    clearInterval(state.gameTimer);
                    showGameOver(guessingGameState.score, "Time's Up!");
                }
            }, 1000);
        }
    };

    const nextQuestion = () => {
        guessingGameState.isAnswered = false;
        
        const newSign = SIGNS[Math.floor(Math.random() * SIGNS.length)];
        guessingGameState.currentSign = newSign;

        const otherOptions = SIGNS.filter(s => s.id !== newSign.id);
        const shuffledOptions = shuffleArray([newSign, ...shuffleArray(otherOptions).slice(0, 3)]);
        guessingGameState.options = shuffledOptions;
        
        document.getElementById('feedback-overlay').classList.add('hidden');
        
        const signDisplay = document.querySelector('.sign-display');
        const optionsContainer = document.getElementById('options-container');

        if (state.currentGameMode === 'FlashMatch') {
            // Show text, options are images
            signDisplay.innerHTML = `
                <span style="font-size: 6rem; font-weight: 900; color: var(--dark);">${newSign.id}</span>
                <div id="feedback-overlay" class="feedback-overlay hidden"></div>`;

            optionsContainer.innerHTML = shuffledOptions.map(opt => `
                <button class="btn btn-image-option" data-id="${opt.id}">
                    <img src="${opt.image}" alt="ASL sign">
                </button>
            `).join('');

        } else { // GuessTheSign and SpeedRound
            // Show image, options are text.
            document.getElementById('sign-image').src = newSign.image;
            document.getElementById('sign-text').classList.add('hidden');
            
            optionsContainer.innerHTML = shuffledOptions.map(opt => `<button class="btn btn-primary" data-id="${opt.id}">${opt.id}</button>`).join('');
        }

        optionsContainer.querySelectorAll('button').forEach(btn => btn.addEventListener('click', handleAnswer));
    };

    const handleAnswer = (e) => {
        if (guessingGameState.isAnswered) return;
        guessingGameState.isAnswered = true;
        const selectedId = e.currentTarget.dataset.id;
        const correctId = guessingGameState.currentSign.id;
        const feedbackEl = document.getElementById('feedback-overlay');

        if (selectedId === correctId) {
            feedbackEl.textContent = '✓';
            feedbackEl.className = 'feedback-overlay correct';
            const points = state.currentGameMode === 'SpeedRound' ? 10 : 1;
            guessingGameState.score += points;
            state.scores[state.currentGameMode] += points;
            saveScores();
            document.getElementById('current-score').textContent = state.scores[state.currentGameMode];
        } else {
            feedbackEl.textContent = '✗';
            feedbackEl.className = 'feedback-overlay incorrect';
        }
        feedbackEl.classList.remove('hidden');
        
        document.querySelectorAll('#options-container button').forEach(btn => {
            if (btn.dataset.id === correctId) btn.style.backgroundColor = 'var(--success)';
            else if (btn.dataset.id === selectedId) btn.style.backgroundColor = 'var(--danger)';
        });

        setTimeout(() => {
            // Reset button styles
            document.querySelectorAll('#options-container button').forEach(btn => {
                btn.removeAttribute('style');
            });

            if (state.currentGameMode !== 'SpeedRound' || guessingGameState.timeLeft > 0) {
                nextQuestion();
            }
        }, 1200);
    };

    // --- MEMORY GAME LOGIC ---
    let memoryGameState = {};
    const initMemoryGame = () => {
        const PAIRS_COUNT = 8;
        const selectedSigns = shuffleArray(SIGNS).slice(0, PAIRS_COUNT);
        let cards = [];
        selectedSigns.forEach((sign, i) => {
            cards.push({ content: sign.id, type: 'letter', signId: sign.id });
            cards.push({ content: sign.image, type: 'image', signId: sign.id });
        });
        
        memoryGameState = {
            cards: shuffleArray(cards).map((card, i) => ({ ...card, id: i, isFlipped: false, isMatched: false })),
            flippedIndices: [],
            moves: 0,
            isLocked: false,
        };

        views.game.innerHTML = `
            <div class="game-container card">
                <div class="game-header">
                    <h2>Memory Game</h2>
                    <button id="exit-game-btn" class="btn btn-ghost">Exit</button>
                </div>
                <div class="game-stats">
                    <div>Moves: <span id="moves-count">0</span></div>
                    <div>Score: <span id="current-score">${state.scores.Memory}</span></div>
                </div>
                <div id="memory-grid" class="memory-grid"></div>
            </div>`;
        document.getElementById('exit-game-btn').addEventListener('click', () => navigate('menu'));
        renderMemoryBoard();
    };

    const renderMemoryBoard = () => {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = memoryGameState.cards.map((card, index) => `
            <div class="memory-card ${card.isFlipped ? 'is-flipped' : ''}" data-index="${index}">
                <div class="memory-card-face memory-card-front">?</div>
                <div class="memory-card-face memory-card-back ${card.isMatched ? 'is-matched' : ''}">
                    ${card.type === 'letter' ? `<span>${card.content}</span>` : `<img src="${card.content}" alt="ASL Sign">`}
                </div>
            </div>
        `).join('');
        grid.querySelectorAll('.memory-card').forEach(card => card.addEventListener('click', handleCardClick));
    };

    const handleCardClick = (e) => {
        const index = parseInt(e.currentTarget.dataset.index, 10);
        const card = memoryGameState.cards[index];

        if (memoryGameState.isLocked || card.isFlipped || card.isMatched || memoryGameState.flippedIndices.length >= 2) return;
        
        card.isFlipped = true;
        memoryGameState.flippedIndices.push(index);
        renderMemoryBoard();

        if (memoryGameState.flippedIndices.length === 2) {
            checkForMatch();
        }
    };
    
    const checkForMatch = () => {
        memoryGameState.isLocked = true;
        memoryGameState.moves++;
        document.getElementById('moves-count').textContent = memoryGameState.moves;

        const [index1, index2] = memoryGameState.flippedIndices;
        const card1 = memoryGameState.cards[index1];
        const card2 = memoryGameState.cards[index2];

        if (card1.signId === card2.signId) {
            card1.isMatched = true;
            card2.isMatched = true;
            memoryGameState.flippedIndices = [];
            memoryGameState.isLocked = false;
            if (memoryGameState.cards.every(c => c.isMatched)) {
                const points = Math.max(0, 100 - memoryGameState.moves);
                state.scores.Memory += points;
                saveScores();
                setTimeout(() => showGameOver(points, "Congratulations!"), 500);
            }
        } else {
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                memoryGameState.flippedIndices = [];
                memoryGameState.isLocked = false;
                renderMemoryBoard();
            }, 1200);
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        loadScores();
        navigate('menu');
    };

    init();
});