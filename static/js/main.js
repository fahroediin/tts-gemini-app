document.addEventListener('DOMContentLoaded', () => {
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    const startGameBtn = document.getElementById('start-game-btn');
    const randomNameBtn = document.getElementById('random-name-btn');
    const finishGameBtn = document.getElementById('finish-game-btn');
    const gameScoreDisplay = document.getElementById('game-score-display');
    const timerDisplay = document.getElementById('timer-display');

    let userSettings = {};
    let gameFinished = false;
    let timerInterval = null;

    function startTimer() {
        let seconds = 0;
        timerDisplay.textContent = "Durasi: 00:00";
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `Durasi: ${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }

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
            
            const puzzleData = await response.json();

            if (puzzleData && puzzleData.grid && puzzleData.clues) {
                renderPuzzle(puzzleData);
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
            alert(`Terjadi kesalahan: ${error.message}`);
            loadingSpinner.classList.add('hidden');
            setupScreen.classList.remove('hidden');
        }
    });

    finishGameBtn.addEventListener('click', () => {
        if (gameFinished) {
            window.location.reload();
            return;
        }

        // --- VALIDASI BARU: Cek apakah ada jawaban yang diisi ---
        const inputs = document.querySelectorAll('#crossword-grid input');
        let hasAnswer = false;
        for (const input of inputs) {
            if (input.value.trim() !== '') {
                hasAnswer = true;
                break;
            }
        }

        if (!hasAnswer) {
            // --- PESAN ERROR SEMENTARA DENGAN SWEETALERT ---
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

        // --- PESAN KONFIRMASI DENGAN SWEETALERT ---
        Swal.fire({
            title: 'Selesaikan Permainan?',
            text: "Apakah Anda yakin? Jawaban akan diperiksa dan permainan akan berakhir.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#42b72a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, selesaikan!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Jika pengguna menekan "Ya", jalankan logika pengecekan
                stopTimer();
                finishGameBtn.disabled = true;
                finishGameBtn.textContent = "Memeriksa...";

                const userGrid = [];
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

                    const resultData = await response.json();
                    
                    const resultGrid = resultData.result_grid;
                    inputs.forEach(input => {
                        const row = parseInt(input.dataset.row, 10);
                        const col = parseInt(input.dataset.col, 10);
                        
                        input.classList.remove('correct', 'incorrect');

                        if (resultGrid[row][col] === 'correct') {
                            input.classList.add('correct');
                        } else if (resultGrid[row][col] === 'incorrect') {
                            input.classList.add('incorrect');
                        }
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
});