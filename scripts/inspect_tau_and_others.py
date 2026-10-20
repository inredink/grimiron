import os
from PIL import Image
import numpy as np

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"

tau_files = ["T'au Sept Symbol.png", "Vior'la Sept Symbol.png", "Sa'cea Sept Symbol.png", "Bork'an Sept Symbol.png"]
for f in tau_files:
    p = os.path.join(symbols_dir, f)
    with Image.open(p) as img:
        arr = np.array(img.convert('RGBA'))
        print(f"--- {f} ---")
        print(f"Shape: {arr.shape}")
        # Count transparent vs opaque
        print(f"Alpha unique values: {np.unique(arr[:, :, 3])[:10]}")
        # Look at non-transparent pixels
        non_trans = arr[arr[:, :, 3] > 0]
        print(f"Color samples (R,G,B,A): {non_trans[:5]}")
        # Mean RGB of non-transparent
        print(f"Mean RGB of visible: {np.mean(non_trans[:, :3], axis=0)}")

other_files = [
    "Cadian Shock Troops Symbol.png",
    "Farsight Enclaves Symbol.png",
    "Night Lords Symbol.jpg",
    "Order of the Valorous Heart Symbol.png",
    "The Bladed Cog Symbol.png",
    "Blood Angels Symbol.jpg",
    "Salamanders Symbol.png"
]

for f in other_files:
    p = os.path.join(symbols_dir, f)
    with Image.open(p) as img:
        arr = np.array(img.convert('RGB'))
        print(f"\n--- {f} ---")
        print(f"Shape: {arr.shape}")
        # Sample center vs corner
        print(f"Top-Left (0,0): {arr[0, 0]}")
        print(f"Center pixel: {arr[arr.shape[0]//2, arr.shape[1]//2]}")
        # Histogram of grayscale
        gray = np.array(img.convert('L'))
        print(f"Gray min: {np.min(gray)}, max: {np.max(gray)}, median: {np.median(gray)}, mean: {np.mean(gray):.1f}")
