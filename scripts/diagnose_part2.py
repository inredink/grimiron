import os
from PIL import Image
import numpy as np

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"

def ascii_preview(mask, name, w=40, h=20):
    im = Image.fromarray((mask.astype(np.uint8) * 255)).resize((w, h))
    arr = np.array(im) > 128
    print(f"\n--- {name} ({mask.shape[1]}x{mask.shape[0]} -> {w}x{h}) | True pixels: {np.mean(mask)*100:.1f}% ---")
    for row in arr:
        print("".join("#" if p else " " for p in row))

items = [
    "Cult of Strife Symbol.jpg",
    "Nihilakh Dynasty Symbol.jpg",
    "Blood Axes Symbol.png",
    "Hosts of Slaanesh Symbol.jpg",
    "Necron Symbol.jpg",
    "Ork Symbol.jpg",
    "Tyranid Symbol.jpg",
    "Genestealer Cult Symbol.png",
    "Chaos Daemons Symbol.jpg",
    "Aeldari Symbol.png",
    "Adeptus Mechanicus Symbol.png",
    "Grey Knights Symbol.jpg",
    "Heretic Astartes Symbol.png",
    "Thousand Sons Symbol.png",
    "World Eaters Symbol.jpg"
]

for filename in items:
    fp = os.path.join(symbols_dir, filename)
    with Image.open(fp) as im:
        arr = np.array(im.convert('RGB'))
        gray = np.mean(arr, axis=2)
        corners = [arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]
        corner_mean = np.mean(corners, axis=0)
        corner_lum = np.mean(corner_mean)
        
        print(f"\n==========================================")
        print(f"FILE: {filename}")
        print(f"Size: {im.size}, Corner lum: {corner_lum:.1f}")
        
        # Test dark emblem vs light emblem
        if corner_lum > 150: # Light bg
            m1 = gray < 180
            m2 = gray < 100
            ascii_preview(m1, f"{filename} (gray < 180)")
            ascii_preview(m2, f"{filename} (gray < 100)")
        else: # Dark bg
            m1 = gray > 80
            m2 = gray > 140
            ascii_preview(m1, f"{filename} (gray > 80)")
            ascii_preview(m2, f"{filename} (gray > 140)")
