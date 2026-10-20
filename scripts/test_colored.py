import os
import numpy as np
from PIL import Image

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
preview_dir = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\scratch\preview_test"
os.makedirs(preview_dir, exist_ok=True)

test_files = [
    "Adepta Sororitas symbol.jpg",
    "Blood Angels Symbol.jpg",
    "Cadian Shock Troops Symbol.png",
    "Salamanders Symbol.png",
    "Farsight Enclaves Symbol.png",
    "Night Lords Symbol.jpg",
    "Order of the Valorous Heart Symbol.png",
    "The Bladed Cog Symbol.png"
]

for f in test_files:
    p = os.path.join(symbols_dir, f)
    with Image.open(p) as img:
        arr = np.array(img.convert('RGB'))
        gray = np.array(img.convert('L'))
        
        if "Adepta Sororitas" in f:
            mask = (arr[:,:,0] < 70) & (arr[:,:,1] < 70) & (arr[:,:,2] < 70)
        elif "Blood Angels" in f:
            # Blood Angels emblem is black/dark drop with wings
            # Background is red (R~175, G~36, B~31)
            # Emblem is dark drop or black silhouette:
            # Let's see if the drop/wings are darker than red background
            mask = (arr[:,:,0] < 80)
        elif "Cadian" in f:
            # White/bright emblem on dark green bg
            mask = gray > 130
        elif "Salamanders" in f:
            # White dragon head on green bg
            mask = (arr[:,:,0] > 160) & (arr[:,:,1] > 160)
        elif "Farsight" in f:
            # Farsight: red circle with white emblem inside or black emblem
            # Let's check difference from gray bg ~ 131
            mask = np.linalg.norm(arr.astype(float) - [131, 131, 131], axis=2) > 40
        elif "Night Lords" in f:
            # Bat winged skull on blue-grey background ~ [137, 144, 171]
            diff = np.linalg.norm(arr.astype(float) - [137, 144, 171], axis=2)
            mask = diff > 45
        elif "Valorous Heart" in f:
            # Order of the Valorous Heart: black heart on grey bg ~ 153
            mask = gray < 100
        elif "Bladed Cog" in f:
            # The Bladed Cog: dark cog on grey bg
            mask = gray < 70
        else:
            mask = gray < 128
            
        # Save preview: white on dark gray
        h, w = mask.shape
        prev = np.full((h, w, 3), 30, dtype=np.uint8)
        prev[mask] = [255, 255, 255]
        clean_name = f.replace(" ", "_").replace("'", "").replace(".jpg", "").replace(".png", "")
        Image.fromarray(prev).save(os.path.join(preview_dir, f"{clean_name}.png"))
        print(f"Saved preview for {f}: coverage {np.mean(mask)*100:.1f}%")
