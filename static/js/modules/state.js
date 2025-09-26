export const gameState = {
    userSettings: {},
    gameFinished: false,
    timerInterval: null,
    currentFocus: { row: null, col: null, direction: 'across' },
    puzzleData: {}
};

export function resetState() {
    gameState.gameFinished = false;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    gameState.currentFocus = { row: null, col: null, direction: 'across' };
    gameState.puzzleData = {};
}