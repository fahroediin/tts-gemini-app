import sqlite3
import json

DB_NAME = "crossword.db"
CATEGORIES = ["Ilmu Pengetahuan", "Geografi Dunia", "Hewan", "Makanan & Minuman", "Teknologi", "Sejarah", "Olahraga"]

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            grid_size INTEGER NOT NULL,
            theme TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            suggestion TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS puzzle_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            theme TEXT NOT NULL,
            puzzle_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def add_score(name, score, grid_size, theme):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO leaderboard (name, score, grid_size, theme) VALUES (?, ?, ?, ?)",
                   (name, score, grid_size, theme))
    conn.commit()
    conn.close()

def get_leaderboard(limit=10):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT ?", (limit,))
    scores = cursor.fetchall()
    conn.close()
    return scores

def add_feedback(suggestion):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO feedback (suggestion) VALUES (?)", (suggestion,))
    conn.commit()
    conn.close()

def get_puzzle_stock_count(theme):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM puzzle_cache WHERE theme = ?", (theme,))
    count = cursor.fetchone()[0]
    conn.close()
    return count

def add_puzzle_to_cache(theme, puzzle_data_dict):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    puzzle_json_string = json.dumps(puzzle_data_dict)
    cursor.execute("INSERT INTO puzzle_cache (theme, puzzle_data) VALUES (?, ?)", (theme, puzzle_json_string))
    conn.commit()
    conn.close()
    print(f"INFO: 1 puzzle baru untuk tema '{theme}' telah ditambahkan ke cache.")

def get_and_delete_puzzle(theme):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, puzzle_data FROM puzzle_cache WHERE theme = ? ORDER BY id ASC LIMIT 1", (theme,))
    result = cursor.fetchone()
    
    if result:
        puzzle_id, puzzle_json_string = result
        cursor.execute("DELETE FROM puzzle_cache WHERE id = ?", (puzzle_id,))
        conn.commit()
        conn.close()
        return json.loads(puzzle_json_string)
    else:
        conn.close()
        return None