document.addEventListener('DOMContentLoaded', () => {
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    const startGameBtn = document.getElementById('start-game-btn');
    const randomNameBtn = document.getElementById('random-name-btn');
    const finishGameBtn = document.getElementById('finish-game-btn');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');

    let userSettings = {};

    randomNameBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/get-random-name');
            const data = await response.json();
            document.getElementById('player-name').value = data.name;
        } catch (error) {
            console.error("Gagal mendapatkan nama acak:", error);
        }
    });

    startGameBtn.addEventListener('click', async () => {
        const playerNameInput = document.getElementById('player-name');
        let playerName = playerNameInput.value;
        if (!playerName) {
            try {
                const response = await fetch('/api/get-random-name');
                const data = await response.json();
                playerName = data.name;
                playerNameInput.value = playerName;
            } catch (error) {
                playerName = "Pemain Acak";
            }
        }
        
        const theme = document.getElementById('theme-select').value;
        userSettings = { name: playerName, theme };

        setupScreen.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/generate-puzzle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Gagal memproses permintaan di server." }));
                throw new Error(errorData.error || 'Gagal membuat puzzle dari server');
            }
            
            const puzzleData = await response.json();

            if (puzzleData && puzzleData.grid && puzzleData.clues) {
                renderPuzzle(puzzleData);
                loadingSpinner.classList.add('hidden');
                gameScreen.classList.remove('hidden');
            } else {
                throw new Error("Data puzzle yang diterima tidak valid.");
            }
            
        } catch (error) {
            alert(`Terjadi kesalahan: ${error.message}`);
            loadingSpinner.classList.add('hidden');
            setupScreen.classList.remove('hidden');
        }
    });

    finishGameBtn.addEventListener('click', async () => {
        const userGrid = [];
        const inputs = document.querySelectorAll('#crossword-grid input');
        const size = Math.sqrt(document.querySelectorAll('#crossword-grid .grid-cell').length);
        
        for (let i = 0; i < size; i++) {
            userGrid.push(new Array(size).fill(null));
        }

        inputs.forEach(input => {
            const row = parseInt(input.dataset.row, 10);
            const col = parseInt(input.dataset.col, 10);
            userGrid[row][col] = input.value;
        });

        try {
            const response = await fetch('/api/check-answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grid: userGrid })
            });

            if (!response.ok) {
                throw new Error("Gagal memeriksa jawaban di server.");
            }

            const result = await response.json();
            const score = result.score;

            await fetch('/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userSettings.name,
                    score: score,
                    theme: userSettings.theme
                })
            });

            document.getElementById('final-score').textContent = score;
            await showLeaderboard();
            
            gameScreen.classList.add('hidden');
            endScreen.classList.remove('hidden');

        } catch (error) {
            alert(`Terjadi kesalahan saat menyelesaikan game: ${error.message}`);
        }
    });

    submitFeedbackBtn.addEventListener('click', async () => {
        const suggestion = document.getElementById('feedback-box').value;
        if (suggestion) {
            await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestion })
            });
            alert('Terima kasih atas saran Anda!');
            document.getElementById('feedback-box').value = '';
        }
    });

    function renderPuzzle(data) {
        const gridEl = document.getElementById('crossword-grid');
        const size = data.grid ? data.grid.length : 0;
        if (size === 0) {
            console.error("Data grid kosong atau tidak valid.");
            return;
        }

        gridEl.innerHTML = '';
        gridEl.style.gridTemplateColumns = `repeat(${size}, 35px)`;
        gridEl.style.gridTemplateRows = `repeat(${size}, 35px)`;

        const clueNumbersMap = {};
        if (data.clues && data.clues.across) {
            data.clues.across.forEach(clue => {
                const key = `${clue.row},${clue.col}`;
                if (!clueNumbersMap[key]) clueNumbersMap[key] = clue.number;
            });
        }
        if (data.clues && data.clues.down) {
            data.clues.down.forEach(clue => {
                const key = `${clue.row},${clue.col}`;
                if (!clueNumbersMap[key]) clueNumbersMap[key] = clue.number;
            });
        }

        data.grid.forEach((row, r_idx) => {
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

        const acrossList = document.querySelector('#across-clues ul');
        const downList = document.querySelector('#down-clues ul');
        acrossList.innerHTML = '';
        downList.innerHTML = '';

        if (data.clues && data.clues.across) {
            data.clues.across.forEach(c => {
                const li = document.createElement('li');
                li.textContent = `${c.number}. ${c.clue}`;
                acrossList.appendChild(li);
            });
        }
        if (data.clues && data.clues.down) {
            data.clues.down.forEach(c => {
                const li = document.createElement('li');
                li.textContent = `${c.number}. ${c.clue}`;
                downList.appendChild(li);
            });
        }
    }

    async function showLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const scores = await response.json();
            const listEl = document.getElementById('leaderboard-list');
            listEl.innerHTML = '';
            scores.forEach(score => {
                const li = document.createElement('li');
                li.textContent = `${score[0]} - ${score[1]}`;
                listEl.appendChild(li);
            });
        } catch (error) {
            console.error("Gagal memuat leaderboard:", error);
        }
    }
});