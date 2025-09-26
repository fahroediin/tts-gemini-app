export const elements = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    endScreen: document.getElementById('end-screen'),
    loadingSpinner: document.getElementById('loading-spinner'),
    playerNameInput: document.getElementById('player-name'),
    themeSelect: document.getElementById('theme-select'),
    timerDisplay: document.getElementById('timer-display'),
    gridContainer: document.getElementById('grid-container'),
    acrossCluesList: document.querySelector('#across-clues ul'),
    downCluesList: document.querySelector('#down-clues ul'),
    finalScore: document.getElementById('final-score'),
    leaderboardList: document.getElementById('leaderboard-list'),
    feedbackBox: document.getElementById('feedback-box'),
};

export function showScreen(screen) {
    elements.setupScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.endScreen.classList.add('hidden');
    elements.loadingSpinner.classList.add('hidden');
    screen.classList.remove('hidden');
}

export function renderPuzzle(puzzleData) {
    const gridEl = document.getElementById('crossword-grid');
    const size = puzzleData.grid.length;
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${size}, 38px)`;
    gridEl.style.gridTemplateRows = `repeat(${size}, 38px)`;

    const clueNumbersMap = {};
    puzzleData.clues.across.forEach(clue => {
        const key = `${clue.row},${clue.col}`;
        if (!clueNumbersMap[key]) clueNumbersMap[key] = clue.number;
    });
    puzzleData.clues.down.forEach(clue => {
        const key = `${clue.row},${clue.col}`;
        if (!clueNumbersMap[key]) clueNumbersMap[key] = clue.number;
    });

    puzzleData.grid.forEach((row, r_idx) => {
        row.forEach((cell, c_idx) => {
            const cellEl = document.createElement('div');
            cellEl.classList.add('grid-cell');
            if (cell === null) {
                cellEl.classList.add('black');
            } else {
                const key = `${r_idx},${c_idx}`;
                if (clueNumbersMap[key]) {
                    const numEl = document.createElement('div');
                    numEl.classList.add('clue-number');
                    numEl.textContent = clueNumbersMap[key];
                    cellEl.appendChild(numEl);
                }
                const input = document.createElement('input');
                input.maxLength = 1;
                input.dataset.row = r_idx;
                input.dataset.col = c_idx;
                cellEl.appendChild(input);
            }
            gridEl.appendChild(cellEl);
        });
    });

    elements.acrossCluesList.innerHTML = '';
    puzzleData.clues.across.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.number}. ${c.clue}`;
        li.dataset.number = c.number;
        li.dataset.row = c.row;
        li.dataset.col = c.col;
        elements.acrossCluesList.appendChild(li);
    });
    
    elements.downCluesList.innerHTML = '';
    puzzleData.clues.down.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.number}. ${c.clue}`;
        li.dataset.number = c.number;
        li.dataset.row = c.row;
        li.dataset.col = c.col;
        elements.downCluesList.appendChild(li);
    });
}

export async function showLeaderboard(currentUserName) {
    try {
        const scores = await (await fetch('/api/leaderboard')).json();
        elements.leaderboardList.innerHTML = '';
        if (scores.length === 0) {
            elements.leaderboardList.innerHTML = '<li>Belum ada skor. Jadilah yang pertama!</li>';
        } else {
            scores.forEach(score => {
                const li = document.createElement('li');
                li.textContent = `${score[0]} - ${score[1]}`;
                if (score[0] === currentUserName) {
                    li.classList.add('user-highlight');
                }
                elements.leaderboardList.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Gagal memuat leaderboard:", error);
    }
}