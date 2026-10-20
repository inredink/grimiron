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

# 1. Astra Militarum
im = Image.open(os.path.join(symbols_dir, "Astra Militarum Symbol.png")).convert('RGB')
arr = np.array(im)
# What is the background vs emblem?
# Corner is ~142 (grey checkerboard or solid grey!)
gray = np.mean(arr, axis=2)
print("Astra Militarum gray min/max/mean:", gray.min(), gray.max(), gray.mean())
# Let's test if emblem is black/dark:
mask_dark = gray < 80
mask_bright = gray > 200
ascii_preview(mask_dark, "Astra Militarum (Dark)")
ascii_preview(mask_bright, "Astra Militarum (Bright)")

# 2. Adeptus Custodes
im = Image.open(os.path.join(symbols_dir, "Adeptus Custodes Symbol.png")).convert('RGB')
gray = np.mean(np.array(im), axis=2)
print("Custodes gray min/max/mean:", gray.min(), gray.max(), gray.mean())
ascii_preview(gray < 90, "Custodes (Dark)")
ascii_preview(gray > 180, "Custodes (Bright)")

# 3. Night Lords (new file!)
im = Image.open(os.path.join(symbols_dir, "Night Lords Symbol.jpg"))
print("Night Lords mode:", im.mode)
if im.mode == 'RGBA':
    arr = np.array(im)
    alpha = arr[:, :, 3]
    ascii_preview(alpha > 50, "Night Lords (Alpha)")
else:
    gray = np.mean(np.array(im.convert('RGB')), axis=2)
    ascii_preview(gray < 100, "Night Lords (Dark)")
    ascii_preview(gray > 150, "Night Lords (Bright)")

# 4. Kabal of the Black Heart
im = Image.open(os.path.join(symbols_dir, "Kabal of the Black Heart Symbol.png")).convert('RGBA')
arr = np.array(im)
gray = np.mean(arr[:, :, :3], axis=2)
print("Black Heart gray min/max/mean:", gray.min(), gray.max(), gray.mean())
# The user noted: "the heart is not there in the vector"
# Let's check why the heart was missing! Is the heart black or filled?
ascii_preview(gray < 128, "Black Heart (gray < 128)")
ascii_preview(gray > 200, "Black Heart (gray > 200)")
# Let's inspect unique colors in Black Heart
colors = arr.reshape(-1, 4)
unique_colors, counts = np.unique(colors, axis=0, return_counts=True)
print("Black Heart top colors:")
for c, cnt in sorted(zip(unique_colors, counts), key=lambda x: -x[1])[:10]:
    print(f"  {c} -> {cnt}")
