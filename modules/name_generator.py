import random

DINOSAURS = [
    "Trex", "Stego", "Tricera", "Velo", "Ptero", "Brachio", "Ankylo", "Spino"
]

def generate_random_name():
    dino = random.choice(DINOSAURS)
    number = random.randint(100, 999)
    return f"{dino}{number}"