from flask import Flask, render_template, request, jsonify, session
from modules import ai_generator, database, name_generator, background_generator, grid_builder
import os
import time
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import json

def number_and_format_puzzle(grid, placed_words):
    """Fungsi untuk melakukan penomoran dan memformat output akhir."""
    if not grid or not placed_words:
        return None

    clue_positions = {}
    clue_counter = 1
    
    placed_words.sort(key=lambda w: (w['row'], w['col']))
    
    clues_across = []
    clues_down = []
    
    for word_info in placed_words:
        row, col = word_info['row'], word_info['col']
        pos_key = f"{row},{col}"
        
        if pos_key not in clue_positions:
            clue_positions[pos_key] = clue_counter
            clue_counter += 1
        
        number = clue_positions[pos_key]
        
        formatted_clue = {
            "number": number,
            "clue": word_info['clue'],
            "row": row,
            "col": col
        }
        
        if word_info['direction'] == 'across':
            clues_across.append(formatted_clue)
        else:
            clues_down.append(formatted_clue)
            
    final_grid = [[char if char else None for char in row] for row in grid]
            
    return {
        "grid": final_grid,
        "clues": {
            "across": clues_across,
            "down": clues_down
        }
    }

def create_app():
    app = Flask(__name__)
    app.secret_key = os.urandom(24)

    with app.app_context():
        database.init_db()
        
        def new_check_and_refill_stock():
            print("SCHEDULER: Memeriksa stok puzzle...")
            for theme in database.CATEGORIES:
                try:
                    current_stock = database.get_puzzle_stock_count(theme)
                    print(f"SCHEDULER: Stok untuk '{theme}': {current_stock}")
                    if current_stock <= background_generator.MIN_STOCK:
                        needed = background_generator.TARGET_STOCK - current_stock
                        print(f"SCHEDULER: Stok '{theme}' rendah. Generate {needed} puzzle baru.")
                        for i in range(needed):
                            print(f"SCHEDULER: Generate puzzle ke-{i+1}/{needed} untuk '{theme}'...")
                            words_data = ai_generator.generate_crossword_data(theme, 25)
                            if words_data:
                                grid, placed_words = grid_builder.build_grid(words_data, 15)
                                final_puzzle = number_and_format_puzzle(grid, placed_words)
                                if final_puzzle:
                                    database.add_puzzle_to_cache(theme, final_puzzle)
                            else:
                                print(f"SCHEDULER: Gagal generate kata untuk '{theme}'.")
                            time.sleep(5)
                except Exception as e:
                    print(f"SCHEDULER: Error saat memeriksa '{theme}': {e}")
        
        background_generator.check_and_refill_stock = new_check_and_refill_stock
        
        print("SERVER STARTUP: Memulai pengisian stok awal...")
        background_generator.check_and_refill_stock()
        print("SERVER STARTUP: Pengisian stok awal selesai.")

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/api/generate-puzzle', methods=['POST'])
    def generate_puzzle():
        data = request.json
        theme = data.get('theme', 'Umum')
        
        puzzle_data = database.get_and_delete_puzzle(theme)
        
        if not puzzle_data:
            print(f"WARNING: Cache untuk tema '{theme}' kosong! Generating on-the-fly.")
            words_data = ai_generator.generate_crossword_data(theme, 25)
            if not words_data:
                return jsonify({"error": "Gagal mendapatkan kata dari AI."}), 500
            
            grid, placed_words = grid_builder.build_grid(words_data, 15)
            puzzle_data = number_and_format_puzzle(grid, placed_words)
        
        if not puzzle_data:
            return jsonify({"error": "Gagal membuat puzzle yang valid."}), 500

        session['solution_grid'] = puzzle_data['grid']
        session['start_time'] = time.time()

        return jsonify(puzzle_data)

    @app.route('/api/check-answers', methods=['POST'])
    def check_answers():
        user_grid = request.json.get('grid')
        solution_grid = session.get('solution_grid')
        start_time = session.get('start_time', time.time())

        if not user_grid or not solution_grid:
            return jsonify({"error": "Solusi tidak ditemukan di session."}), 400

        correct_cells = 0
        total_cells = 0
        
        for r in range(len(solution_grid)):
            for c in range(len(solution_grid[r])):
                if solution_grid[r][c] is not None:
                    total_cells += 1
                    if user_grid[r][c] and user_grid[r][c].upper() == solution_grid[r][c]:
                        correct_cells += 1
        
        time_taken = time.time() - start_time
        accuracy_score = (correct_cells / total_cells) * 10000 if total_cells > 0 else 0
        time_bonus = max(0, 300 - time_taken) * 10
        
        final_score = int(accuracy_score + time_bonus)

        return jsonify({
            "score": final_score,
            "correct_cells": correct_cells,
            "total_cells": total_cells
        })

    @app.route('/api/get-random-name', methods=['GET'])
    def get_random_name(): return jsonify({"name": name_generator.generate_random_name()})

    @app.route('/api/leaderboard', methods=['GET'])
    def get_leaderboard_data(): return jsonify(database.get_leaderboard())

    @app.route('/api/submit-score', methods=['POST'])
    def submit_score():
        data = request.json
        database.add_score(data.get('name'), data.get('score'), 15, data.get('theme'))
        return jsonify({"success": True})

    @app.route('/api/submit-feedback', methods=['POST'])
    def submit_feedback():
        data = request.json
        database.add_feedback(data.get('suggestion'))
        return jsonify({"success": True})

    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(background_generator.check_and_refill_stock, 'interval', minutes=5)
    scheduler.start()
    print("SERVER STARTUP: Scheduler latar belakang telah dimulai.")
    
    atexit.register(lambda: scheduler.shutdown())
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)