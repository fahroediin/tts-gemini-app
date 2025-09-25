import random

class CrosswordGenerator:
    def __init__(self, words_data, size):
        self.words_data = sorted(words_data, key=lambda x: len(x.get('jawaban', '')), reverse=True)
        self.size = size
        self.grid = [['' for _ in range(size)] for _ in range(size)]
        self.placed_words = []

    def can_place_word(self, word, row, col, direction):
        if direction == 'across':
            if col + len(word) > self.size or col < 0 or row < 0 or row >= self.size:
                return False
            
            # ATURAN BARU: Cek spasi kosong sebelum dan sesudah kata
            if col > 0 and self.grid[row][col - 1] != '':
                return False
            if col + len(word) < self.size and self.grid[row][col + len(word)] != '':
                return False

            for i in range(len(word)):
                char_on_grid = self.grid[row][col + i]
                # Jika sel tidak kosong, huruf harus cocok (untuk persilangan)
                if char_on_grid != '' and char_on_grid != word[i]:
                    return False
                # Jika sel kosong, pastikan tidak ada kata lain yang menempel di atas/bawah
                if char_on_grid == '':
                    if row > 0 and self.grid[row - 1][col + i] != '':
                        return False
                    if row < self.size - 1 and self.grid[row + 1][col + i] != '':
                        return False
        else: # direction == 'down'
            if row + len(word) > self.size or row < 0 or col < 0 or col >= self.size:
                return False

            # ATURAN BARU: Cek spasi kosong sebelum dan sesudah kata
            if row > 0 and self.grid[row - 1][col] != '':
                return False
            if row + len(word) < self.size and self.grid[row + len(word)][col] != '':
                return False

            for i in range(len(word)):
                char_on_grid = self.grid[row + i][col]
                if char_on_grid != '' and char_on_grid != word[i]:
                    return False
                if char_on_grid == '':
                    if col > 0 and self.grid[row + i][col - 1] != '':
                        return False
                    if col < self.size - 1 and self.grid[row + i][col + 1] != '':
                        return False
        return True

    def place_word(self, word_info, row, col, direction):
        word = word_info['jawaban']
        if direction == 'across':
            for i in range(len(word)):
                self.grid[row][col + i] = word[i]
        else:
            for i in range(len(word)):
                self.grid[row + i][col] = word[i]
        
        self.placed_words.append({
            'clue': word_info['pertanyaan'],
            'answer': word,
            'row': row,
            'col': col,
            'direction': direction
        })

    def generate(self):
        if not self.words_data:
            return
        
        first_word_info = self.words_data.pop(0)
        start_row = self.size // 2
        start_col = (self.size - len(first_word_info['jawaban'])) // 2
        self.place_word(first_word_info, start_row, start_col, 'across')

        words_to_place = self.words_data[:]
        for _ in range(len(words_to_place) * 2):
            if not words_to_place: break
            word_info = words_to_place.pop(0)
            word_to_place = word_info['jawaban']
            
            possible_fits = []
            for i, char_to_place in enumerate(word_to_place):
                for placed_info in self.placed_words:
                    for j, char_on_grid in enumerate(placed_info['answer']):
                        if char_to_place == char_on_grid:
                            if placed_info['direction'] == 'across':
                                row = placed_info['row'] - i
                                col = placed_info['col'] + j
                                if self.can_place_word(word_to_place, row, col, 'down'):
                                    possible_fits.append({'info': word_info, 'row': row, 'col': col, 'dir': 'down'})
                            else:
                                row = placed_info['row'] + j
                                col = placed_info['col'] - i
                                if self.can_place_word(word_to_place, row, col, 'across'):
                                    possible_fits.append({'info': word_info, 'row': row, 'col': col, 'dir': 'across'})
            
            if possible_fits:
                fit = random.choice(possible_fits)
                self.place_word(fit['info'], fit['row'], fit['col'], fit['dir'])
            else:
                words_to_place.append(word_info)

def build_grid(words_data, size):
    # Coba beberapa kali untuk mendapatkan hasil terbaik
    best_grid = None
    best_placed_words = []
    max_placed_count = 0

    for _ in range(10): # Coba 10 kali untuk variasi
        generator = CrosswordGenerator(list(words_data), size)
        generator.generate()
        if len(generator.placed_words) > max_placed_count:
            max_placed_count = len(generator.placed_words)
            best_grid = generator.grid
            best_placed_words = generator.placed_words
    
    return best_grid, best_placed_words