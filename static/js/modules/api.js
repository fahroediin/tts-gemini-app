export async function getRandomName() {
    const response = await fetch('/api/get-random-name');
    return await response.json();
}

export async function logGameStart(name, theme) {
    fetch('/api/log-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, theme })
    });
}

export async function generatePuzzle(theme) {
    const response = await fetch('/api/generate-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Gagal memproses permintaan di server." }));
        throw new Error(errorData.error || 'Gagal membuat puzzle dari server');
    }
    return await response.json();
}

export async function checkAnswers(grid) {
    const response = await fetch('/api/check-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid })
    });
    if (!response.ok) throw new Error("Gagal memeriksa jawaban di server.");
    return await response.json();
}

export async function submitScore(name, score, theme) {
    await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, theme })
    });
}

export async function submitFeedback(suggestion) {
    await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion })
    });
}

export async function getLeaderboard() {
    const response = await fetch('/api/leaderboard');
    return await response.json();
}