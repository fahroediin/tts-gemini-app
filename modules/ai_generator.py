import os
import google.generativeai as genai
import json
import re
from dotenv import load_dotenv

load_dotenv()

try:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY tidak ditemukan di file .env")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
except Exception as e:
    print(f"FATAL: Gagal mengkonfigurasi Gemini. Error: {e}")
    model = None

def generate_crossword_data(theme, word_count):
    if not model:
        print("ERROR: Model Gemini tidak terinisialisasi.")
        return None

    prompt = f"""
    Anda adalah ahli pembuat Teka Teki Silang (TTS) untuk Bahasa Indonesia.
    Buat daftar {word_count} kata yang berhubungan dengan tema "{theme}".

    Aturan:
    1. Jawaban harus satu kata, tanpa spasi, dan relevan dengan tema.
    2. Pertanyaan harus berupa petunjuk yang jelas dan ringkas.
    3. Jawaban harus dalam huruf kapital semua.
    4. Berikan output HANYA dalam format JSON yang valid, berupa sebuah array dari objek.

    Contoh format:
    [
      {{
        "jawaban": "BAKSO",
        "pertanyaan": "Makanan berkuah dengan bola daging."
      }},
      {{
        "jawaban": "SATE",
        "pertanyaan": "Daging yang ditusuk dan dibakar."
      }}
    ]

    Sekarang, buatkan untuk tema "{theme}":
    """
    try:
        response = model.generate_content(prompt)
        raw_text = response.text
        
        match = re.search(r'\[.*\]', raw_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            return json.loads(json_str)
        else:
            cleaned_response = raw_text.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_response)

    except json.JSONDecodeError as e:
        print(f"--- GAGAL PARSING JSON ---\nError: {e}\n--- Respons Mentah dari Gemini ---\n{raw_text}\n-----------------------------")
        return None
    except Exception as e:
        print(f"Error saat memanggil AI: {e}")
        return None