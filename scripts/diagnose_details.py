import os
from PIL import Image
import numpy as np

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"

def inspect_img(name):
    fp = os.path.join(symbols_dir, name)
    im = Image.open(fp).convert('RGB')
    arr = np.array(im)
    print(f"\n==========================================")
    print(f"FILE: {name}")
    print(f"Shape: {arr.shape}")
    print(f"Corner RGB: {arr[0, 0]}")
    # Sample center
    cy, cx = arr.shape[0]//2, arr.shape[1]//2
    print(f"Center RGB: {arr[cy, cx]}")
    
    # Histogram of top colors or channel breakdown
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    print(f"R range: [{r.min()}, {r.max()}], mean: {r.mean():.1f}")
    print(f"G range: [{g.min()}, {g.max()}], mean: {g.mean():.1f}")
    print(f"B range: [{b.min()}, {b.max()}], mean: {b.mean():.1f}")

for f in [
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
]:
    inspect_img(f)
