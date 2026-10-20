import os
from PIL import Image
import numpy as np

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
special_files = [
    "Blood Angels Symbol.jpg",
    "Cadian Shock Troops Symbol.png",
    "Salamanders Symbol.png",
    "Farsight Enclaves Symbol.png",
    "Night Lords Symbol.jpg",
    "The Bladed Cog Symbol.png",
    "Order of the Valorous Heart Symbol.png",
    "Adepta Sororitas symbol.jpg",
    "Deathskulls Symbol.jpg",
    "Hosts of Slaanesh Symbol.jpg",
    "Iron Hands Symbol.png",
    "Iyanden Symbol.jpg",
    "Nihilakh Dynasty Symbol.jpg",
    "Novokh Dynasty Symbol.PNG",
    "Plague Hosts of Nurgle Symbol.png"
]

for f in special_files:
    p = os.path.join(symbols_dir, f)
    with Image.open(p) as img:
        arr = np.array(img.convert('RGB'))
        h, w, _ = arr.shape
        center = arr[h//4:3*h//4, w//4:3*w//4]
        corners = [arr[0, 0], arr[0, w-1], arr[h-1, 0], arr[h-1, w-1]]
        bg_rgb = np.mean(corners, axis=0)
        fg_rgb = np.mean(center, axis=(0, 1))
        print(f"File: {f}")
        print(f"  BG Corner RGB: {bg_rgb.astype(int)}")
        print(f"  Center Area Mean RGB: {fg_rgb.astype(int)}")
        # Check center min and max
        print(f"  Center Min RGB: {np.min(center, axis=(0,1))}, Max RGB: {np.max(center, axis=(0,1))}")
