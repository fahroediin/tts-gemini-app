import * as api from './modules/api.js';
import { gameState, resetState } from './modules/state.js';
import { elements, showScreen, renderPuzzle, showLeaderboard } from './modules/ui.js';
import { initializePuzzleInteraction } from './modules/puzzle.js';

document.addEventListener('DOMContentLoaded', () => {
    const startGameBtn = document.getElementById('start-game-btn');
    const randomNameBtn = document.getElementById('random-name-btn');
    const finishGameBtn = document.getElementById('finish-game-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');

    // --- Setup Listeners ---
    randomNameBtn.addEventListener('click', async () => {
        try {
            const data = await api.getRandomName();
            elements.playerNameInput.value = data.name;
        } catch (error) {
            console.error("Gagal mendapatkan nama acak:", error);
        }
    });

    startGameBtn.addEventListener('click', async () => {
        let playerName = elements.playerNameInput.value;
        if (!playerName) {
            try {
                const data = await api.getRandomName();
                playerName = data.name;
                elements.playerNameInput.value = playerName;
            } catch (error) {
                playerName = "Pemain Acak";
            }
        }
        
        const theme = elements.themeSelect.value;
        gameState.userSettings = { name: playerName, theme };
        resetState();
        api.logGameStart(playerName, theme);

        showScreen(elements.loadingSpinner);

        try {
            const data = await api.generatePuzzle(theme);
            if (data && data.grid && data.clues) {
                gameState.puzzleData = data;
                renderPuzzle(gameState.puzzleData);
                showScreen(elements.gameScreen);
                startTimer();
            } else {
                throw new Error("Data puzzle yang diterima tidak valid.");
            }
        } catch (error) {
            Swal.fire('Error!', `Terjadi kesalahan: ${error.message}`, 'error');
            showScreen(elements.setupScreen);
        }
    });

    // --- Game Logic Listeners ---
    finishGameBtn.addEventListener('click', () => {
        const inputs = document.querySelectorAll('#crossword-grid input');
        if (!Array.from(inputs).some(input => input.value.trim() !== '')) {
            Swal.fire({
                icon: 'error', title: 'Gagal Menyelesaikan',
                text: 'Anda harus mengisi setidaknya satu jawaban terlebih dahulu!',
                timer: 5000, timerProgressBar: true, showConfirmButton: false
            });
            return;
        }

        Swal.fire({
            title: 'Selesaikan Permainan?',
            text: "Apakah Anda yakin? Jawaban akan diperiksa.",
            icon: 'question', showCancelButton: true, confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33', confirmButtonText: 'Ya, selesaikan!', cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                stopTimer();
                finishGameBtn.disabled = true;
                finishGameBtn.textContent = "Memeriksa...";

                const userGrid = [];
                const size = gameState.puzzleData.grid.length;
                for (let i = 0; i < size; i++) userGrid.push(new Array(size).fill(null));
                inputs.forEach(input => {
                    userGrid[input.dataset.row][input.dataset.col] = input.value;
                });

                try {
                    const resultData = await api.checkAnswers(userGrid);
                    
                    inputs.forEach(input => {
                        const { row, col } = input.dataset;
                        input.classList.remove('correct', 'incorrect');
                        if (resultData.result_grid[row][col] === 'correct') input.classList.add('correct');
                        else if (resultData.result_grid[row][col] === 'incorrect') input.classList.add('incorrect');
                        input.disabled = true;
                    });

                    await api.submitScore(gameState.userSettings.name, resultData.score, gameState.userSettings.theme);
                    
                    showScreen(elements.endScreen);
                    elements.finalScore.textContent = resultData.score;
                    await showLeaderboard(gameState.userSettings.name);

                } catch (error) {
                    Swal.fire('Error!', `Terjadi kesalahan: ${error.message}`, 'error');
                    finishGameBtn.disabled = false;
                    finishGameBtn.textContent = "Selesai & Cek Jawaban";
                    startTimer();
                }
            }
        });
    });

    // --- End Screen Listeners ---
    playAgainBtn.addEventListener('click', () => window.location.reload());

    submitFeedbackBtn.addEventListener('click', async () => {
        const suggestion = elements.feedbackBox.value;
        if (suggestion.trim()) {
            await api.submitFeedback(suggestion);
            Swal.fire('Terima Kasih!', 'Saran Anda telah kami terima.', 'success');
            elements.feedbackBox.value = '';
        } else {
            Swal.fire('Oops...', 'Saran tidak boleh kosong.', 'warning');
        }
    });

    // --- Timer Functions ---
    function startTimer() {
        let seconds = 0;
        elements.timerDisplay.textContent = "Durasi: 00:00";
        if (gameState.timerInterval) clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            elements.timerDisplay.textContent = `Durasi: ${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() {
        if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    }

    // Initialize all interactions
    initializePuzzleInteraction();
});