import os
from PIL import Image
import numpy as np

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"

targets = [
    "Astra Militarum Symbol.png",
    "Adeptus Mechanicus Symbol.png",
    "Adeptus Custodes Symbol.png",
    "Grey Knights Symbol.jpg",
    "Heretic Astartes Symbol.png",
    "Night Lords Symbol.jpg",
    "Thousand Sons Symbol.png",
    "World Eaters Symbol.jpg",
    "Chaos Daemons Symbol.jpg",
    "Aeldari Symbol.png",
    "Kabal of the Black Heart Symbol.png",
    "Cult of Strife Symbol.jpg",
    "Necron Symbol.jpg",
    "Nihilakh Dynasty Symbol.jpg",
    "Ork Symbol.jpg",
    "Blood Axes Symbol.png",
    "Tyranid Symbol.jpg",
    "Genestealer Cult Symbol.png",
    "Hosts of Slaanesh Symbol.jpg",
]

for t in targets:
    fp = os.path.join(symbols_dir, t)
    if not os.path.exists(fp):
        print(f"MISSING: {t}")
        continue
    with Image.open(fp) as im:
        im_rgb = im.convert('RGB')
        arr = np.array(im_rgb)
        alpha = None
        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
            im_rgba = im.convert('RGBA')
            alpha = np.array(im_rgba)[:, :, 3]
        
        has_alpha = alpha is not None and np.any(alpha < 250)
        h, w = arr.shape[:2]
        corners = [arr[0, 0], arr[0, w-1], arr[h-1, 0], arr[h-1, w-1]]
        corner_mean = np.mean(corners, axis=0)
        
        print(f"\n==========================================")
        print(f"FILE: {t}")
        print(f"Dimensions: {w}x{h}, Mode: {im.mode}, Has Alpha: {has_alpha}")
        print(f"Corner mean RGB: {corner_mean.astype(int)}")
        if has_alpha:
            print(f"Alpha range: min={alpha.min()}, max={alpha.max()}, mean={alpha.mean():.1f}")
        print(f"Image min RGB: {arr.min(axis=(0,1))}, max RGB: {arr.max(axis=(0,1))}")
