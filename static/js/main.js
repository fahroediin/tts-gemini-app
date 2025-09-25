document.addEventListener('DOMContentLoaded', () => {
    // --- Deklarasi Elemen UI ---
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const loadingSpinner = document.getElementById('loading-spinner');
    const startGameBtn = document.getElementById('start-game-btn');
    const randomNameBtn = document.getElementById('random-name-btn');
    const finishGameBtn = document.getElementById('finish-game-btn');
    const gameScoreDisplay = document.getElementById('game-score-display');
    const timerDisplay = document.getElementById('timer-display');
    const gridContainer = document.getElementById('grid-container');
    const acrossCluesList = document.querySelector('#across-clues ul');
    const downCluesList = document.querySelector('#down-clues ul');

    // --- State Management ---
    let userSettings = {};
    let gameFinished = false;
    let timerInterval = null;
    let currentFocus = { row: null, col: null, direction: 'across' };
    let puzzleData = {};

    // --- Fungsi Timer ---
    function startTimer() {
        let seconds = 0;
        timerDisplay.textContent = "Durasi: 00:00";
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `Durasi: ${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
    }

    // --- Event Listeners untuk Setup ---
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
        gameFinished = false;

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
            
            const data = await response.json();

            if (data && data.grid && data.clues) {
                puzzleData = data;
                renderPuzzle();
                loadingSpinner.classList.add('hidden');
                gameScreen.classList.remove('hidden');
                gameScoreDisplay.classList.add('hidden');
                finishGameBtn.textContent = "Selesai & Cek Jawaban";
                finishGameBtn.disabled = false;
                startTimer();
            } else {
                throw new Error("Data puzzle yang diterima tidak valid.");
            }
            
        } catch (error) {
            Swal.fire('Error!', `Terjadi kesalahan: ${error.message}`, 'error');
            loadingSpinner.classList.add('hidden');
            setupScreen.classList.remove('hidden');
        }
    });

    // --- Logika Penyelesaian Game ---
    finishGameBtn.addEventListener('click', () => {
        if (gameFinished) {
            window.location.reload();
            return;
        }

        const inputs = document.querySelectorAll('#crossword-grid input');
        let hasAnswer = Array.from(inputs).some(input => input.value.trim() !== '');

        if (!hasAnswer) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menyelesaikan',
                text: 'Anda harus mengisi setidaknya satu jawaban terlebih dahulu!',
                timer: 5000,
                timerProgressBar: true,
                showConfirmButton: false
            });
            return;
        }

        Swal.fire({
            title: 'Selesaikan Permainan?',
            text: "Apakah Anda yakin? Jawaban akan diperiksa dan permainan akan berakhir.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, selesaikan!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                stopTimer();
                finishGameBtn.disabled = true;
                finishGameBtn.textContent = "Memeriksa...";

                const userGrid = [];
                const size = puzzleData.grid.length;
                
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

                    if (!response.ok) throw new Error("Gagal memeriksa jawaban di server.");

                    const resultData = await response.json();
                    
                    const resultGrid = resultData.result_grid;
                    inputs.forEach(input => {
                        const row = parseInt(input.dataset.row, 10);
                        const col = parseInt(input.dataset.col, 10);
                        
                        input.classList.remove('correct', 'incorrect');
                        if (resultGrid[row][col] === 'correct') input.classList.add('correct');
                        else if (resultGrid[row][col] === 'incorrect') input.classList.add('incorrect');
                        input.disabled = true;
                    });

                    gameScoreDisplay.textContent = `Skor Anda: ${resultData.score}`;
                    gameScoreDisplay.classList.remove('hidden');

                    await fetch('/api/submit-score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: userSettings.name,
                            score: resultData.score,
                            theme: userSettings.theme
                        })
                    });

                    finishGameBtn.textContent = "Main Lagi";
                    finishGameBtn.disabled = false;
                    gameFinished = true;

                } catch (error) {
                    Swal.fire('Error!', `Terjadi kesalahan saat menyelesaikan game: ${error.message}`, 'error');
                    finishGameBtn.disabled = false;
                    finishGameBtn.textContent = "Selesai & Cek Jawaban";
                    startTimer();
                }
            }
        });
    });

    // --- Logika Interaksi Grid dan Petunjuk ---

    function highlightCellsAndClues() {
        document.querySelectorAll('.current-focus, .current-word, .current-clue').forEach(el => {
            el.classList.remove('current-focus', 'current-word', 'current-clue');
        });

        if (currentFocus.row === null) return;

        const { acrossWord, downWord, acrossClueEl, downClueEl } = findWordsAndClues(currentFocus.row, currentFocus.col);

        if (currentFocus.direction === 'across' && acrossWord) {
            acrossWord.cells.forEach(cell => cell.classList.add('current-word'));
            if (acrossClueEl) acrossClueEl.classList.add('current-clue');
        } else if (currentFocus.direction === 'down' && downWord) {
            downWord.cells.forEach(cell => cell.classList.add('current-word'));
            if (downClueEl) downClueEl.classList.add('current-clue');
        }

        const activeCell = document.querySelector(`input[data-row='${currentFocus.row}'][data-col='${currentFocus.col}']`);
        if (activeCell) {
            activeCell.parentElement.classList.add('current-focus');
            activeCell.focus();
        }
    }

    function findWordsAndClues(row, col) {
        let acrossWord = null, downWord = null, acrossClueEl = null, downClueEl = null;

        puzzleData.clues.across.forEach(clue => {
            const wordLength = getWordLength(clue.number, 'across');
            if (row === clue.row && col >= clue.col && col < clue.col + wordLength) {
                acrossWord = { clue, cells: [] };
                for (let i = 0; i < wordLength; i++) {
                    const cell = document.querySelector(`input[data-row='${clue.row}'][data-col='${clue.col + i}']`);
                    if (cell) acrossWord.cells.push(cell.parentElement);
                }
                acrossClueEl = document.querySelector(`#across-clues li[data-number='${clue.number}']`);
            }
        });

        puzzleData.clues.down.forEach(clue => {
            const wordLength = getWordLength(clue.number, 'down');
            if (col === clue.col && row >= clue.row && row < clue.row + wordLength) {
                downWord = { clue, cells: [] };
                for (let i = 0; i < wordLength; i++) {
                    const cell = document.querySelector(`input[data-row='${clue.row + i}'][data-col='${clue.col}']`);
                    if (cell) downWord.cells.push(cell.parentElement);
                }
                downClueEl = document.querySelector(`#down-clues li[data-number='${clue.number}']`);
            }
        });

        return { acrossWord, downWord, acrossClueEl, downClueEl };
    }

    function getWordLength(number, direction) {
        const grid = puzzleData.grid;
        const size = grid.length;
        const clue = puzzleData.clues[direction].find(c => c.number === number);
        if (!clue) return 0;

        let length = 0;
        if (direction === 'across') {
            for (let c = clue.col; c < size && grid[clue.row][c] !== null; c++) length++;
        } else {
            for (let r = clue.row; r < size && grid[r][clue.col] !== null; r++) length++;
        }
        return length;
    }

    // --- EVENT LISTENER YANG DIPERBAIKI ---
    gridContainer.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') return;

        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);

        const { acrossWord, downWord } = findWordsAndClues(row, col);

        if (currentFocus.row === row && currentFocus.col === col) {
            // --- LOGIKA TOGGLE BARU ---
            // Jika sedang mendatar dan ada kata menurun, ganti ke menurun.
            if (currentFocus.direction === 'across' && downWord) {
                currentFocus.direction = 'down';
            // Jika sedang menurun dan ada kata mendatar, ganti ke mendatar.
            } else if (currentFocus.direction === 'down' && acrossWord) {
                currentFocus.direction = 'across';
            }
        } else {
            // --- LOGIKA KLIK BARU ---
            currentFocus.row = row;
            currentFocus.col = col;
            // Default ke mendatar jika ada, jika tidak baru ke menurun.
            if (acrossWord) {
                currentFocus.direction = 'across';
            } else if (downWord) {
                currentFocus.direction = 'down';
            }
        }
        highlightCellsAndClues();
    });

    gridContainer.addEventListener('keydown', (e) => {
        if (currentFocus.row === null || gameFinished) return;
        let { row, col, direction } = currentFocus;
        const size = puzzleData.grid.length;
        
        const key = e.key;
        if (key.length === 1 && key.match(/[a-z0-9]/i)) {
            setTimeout(() => {
                if (direction === 'across' && col + 1 < size) {
                    const nextInput = document.querySelector(`input[data-row='${row}'][data-col='${col + 1}']`);
                    if (nextInput) {
                        currentFocus.col++;
                        highlightCellsAndClues();
                    }
                } else if (direction === 'down' && row + 1 < size) {
                    const nextInput = document.querySelector(`input[data-row='${row + 1}'][data-col='${col}']`);
                    if (nextInput) {
                        currentFocus.row++;
                        highlightCellsAndClues();
                    }
                }
            }, 0);
        } else if (key === 'ArrowUp') { e.preventDefault(); if (row > 0) currentFocus.row--; }
        else if (key === 'ArrowDown') { e.preventDefault(); if (row < size - 1) currentFocus.row++; }
        else if (key === 'ArrowLeft') { e.preventDefault(); if (col > 0) currentFocus.col--; }
        else if (key === 'ArrowRight') { e.preventDefault(); if (col < size - 1) currentFocus.col++; }
        else if (key === 'Backspace' && e.target.value === '') {
             setTimeout(() => {
                if (direction === 'across' && col > 0) {
                    const prevInput = document.querySelector(`input[data-row='${row}'][data-col='${col - 1}']`);
                    if (prevInput) {
                        currentFocus.col--;
                        highlightCellsAndClues();
                    }
                } else if (direction === 'down' && row > 0) {
                    const prevInput = document.querySelector(`input[data-row='${row - 1}'][data-col='${col}']`);
                    if (prevInput) {
                        currentFocus.row--;
                        highlightCellsAndClues();
                    }
                }
            }, 0);
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            highlightCellsAndClues();
        }
    });

    function addClueClickListener(listElement) {
        listElement.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                currentFocus.row = parseInt(li.dataset.row);
                currentFocus.col = parseInt(li.dataset.col);
                currentFocus.direction = li.parentElement.parentElement.id === 'across-clues' ? 'across' : 'down';
                highlightCellsAndClues();
            }
        });
    }
    addClueClickListener(acrossCluesList);
    addClueClickListener(downCluesList);

    // --- Fungsi Render ---
    function renderPuzzle() {
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

        acrossCluesList.innerHTML = '';
        puzzleData.clues.across.forEach(c => {
            const li = document.createElement('li');
            li.textContent = `${c.number}. ${c.clue}`;
            li.dataset.number = c.number;
            li.dataset.row = c.row;
            li.dataset.col = c.col;
            acrossCluesList.appendChild(li);
        });
        
        downCluesList.innerHTML = '';
        puzzleData.clues.down.forEach(c => {
            const li = document.createElement('li');
            li.textContent = `${c.number}. ${c.clue}`;
            li.dataset.number = c.number;
            li.dataset.row = c.row;
            li.dataset.col = c.col;
            downCluesList.appendChild(li);
        });
    }
});