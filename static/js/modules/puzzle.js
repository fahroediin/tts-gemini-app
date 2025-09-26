import { gameState } from './state.js';

function highlightCellsAndClues() {
    document.querySelectorAll('.current-focus, .current-word, .current-clue').forEach(el => {
        el.classList.remove('current-focus', 'current-word', 'current-clue');
    });

    if (gameState.currentFocus.row === null) return;

    const { acrossWord, downWord, acrossClueEl, downClueEl } = findWordsAndClues(gameState.currentFocus.row, gameState.currentFocus.col);

    if (gameState.currentFocus.direction === 'across' && acrossWord) {
        acrossWord.cells.forEach(cell => cell.classList.add('current-word'));
        if (acrossClueEl) acrossClueEl.classList.add('current-clue');
    } else if (gameState.currentFocus.direction === 'down' && downWord) {
        downWord.cells.forEach(cell => cell.classList.add('current-word'));
        if (downClueEl) downClueEl.classList.add('current-clue');
    }

    const activeCell = document.querySelector(`input[data-row='${gameState.currentFocus.row}'][data-col='${gameState.currentFocus.col}']`);
    if (activeCell) {
        activeCell.parentElement.classList.add('current-focus');
        activeCell.focus();
    }
}

function findWordsAndClues(row, col) {
    let acrossWord = null, downWord = null, acrossClueEl = null, downClueEl = null;

    gameState.puzzleData.clues.across.forEach(clue => {
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

    gameState.puzzleData.clues.down.forEach(clue => {
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
    const grid = gameState.puzzleData.grid;
    const size = grid.length;
    const clue = gameState.puzzleData.clues[direction].find(c => c.number === number);
    if (!clue) return 0;

    let length = 0;
    if (direction === 'across') {
        for (let c = clue.col; c < size && grid[clue.row][c] !== null; c++) length++;
    } else {
        for (let r = clue.row; r < size && grid[r][clue.col] !== null; r++) length++;
    }
    return length;
}

export function initializePuzzleInteraction() {
    const gridContainer = document.getElementById('grid-container');
    const acrossCluesList = document.querySelector('#across-clues ul');
    const downCluesList = document.querySelector('#down-clues ul');

    gridContainer.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') return;
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const { acrossWord, downWord } = findWordsAndClues(row, col);

        if (gameState.currentFocus.row === row && gameState.currentFocus.col === col) {
            if (gameState.currentFocus.direction === 'across' && downWord) gameState.currentFocus.direction = 'down';
            else if (gameState.currentFocus.direction === 'down' && acrossWord) gameState.currentFocus.direction = 'across';
        } else {
            gameState.currentFocus.row = row;
            gameState.currentFocus.col = col;
            gameState.currentFocus.direction = acrossWord ? 'across' : 'down';
        }
        highlightCellsAndClues();
    });

    gridContainer.addEventListener('keydown', (e) => {
        if (gameState.currentFocus.row === null || gameState.gameFinished) return;
        let { row, col, direction } = gameState.currentFocus;
        const size = gameState.puzzleData.grid.length;
        
        const key = e.key;
        if (key.length === 1 && key.match(/[a-z0-9]/i)) {
            setTimeout(() => {
                if (direction === 'across' && col + 1 < size) {
                    const nextInput = document.querySelector(`input[data-row='${row}'][data-col='${col + 1}']`);
                    if (nextInput) {
                        gameState.currentFocus.col++;
                        highlightCellsAndClues();
                    }
                } else if (direction === 'down' && row + 1 < size) {
                    const nextInput = document.querySelector(`input[data-row='${row + 1}'][data-col='${col}']`);
                    if (nextInput) {
                        gameState.currentFocus.row++;
                        highlightCellsAndClues();
                    }
                }
            }, 0);
        } else if (key === 'ArrowUp') { e.preventDefault(); if (row > 0) gameState.currentFocus.row--; }
        else if (key === 'ArrowDown') { e.preventDefault(); if (row < size - 1) gameState.currentFocus.row++; }
        else if (key === 'ArrowLeft') { e.preventDefault(); if (col > 0) gameState.currentFocus.col--; }
        else if (key === 'ArrowRight') { e.preventDefault(); if (col < size - 1) gameState.currentFocus.col++; }
        else if (key === 'Backspace' && e.target.value === '') {
             setTimeout(() => {
                if (direction === 'across' && col > 0) {
                    const prevInput = document.querySelector(`input[data-row='${row}'][data-col='${col - 1}']`);
                    if (prevInput) {
                        gameState.currentFocus.col--;
                        highlightCellsAndClues();
                    }
                } else if (direction === 'down' && row > 0) {
                    const prevInput = document.querySelector(`input[data-row='${row - 1}'][data-col='${col}']`);
                    if (prevInput) {
                        gameState.currentFocus.row--;
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
                gameState.currentFocus.row = parseInt(li.dataset.row);
                gameState.currentFocus.col = parseInt(li.dataset.col);
                gameState.currentFocus.direction = li.parentElement.parentElement.id === 'across-clues' ? 'across' : 'down';
                highlightCellsAndClues();
            }
        });
    }
    addClueClickListener(acrossCluesList);
    addClueClickListener(downCluesList);
}