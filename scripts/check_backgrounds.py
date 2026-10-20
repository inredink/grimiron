import os
import numpy as np
from PIL import Image

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
files = sorted(os.listdir(symbols_dir))

for f in files:
    path = os.path.join(symbols_dir, f)
    with Image.open(path) as img:
        img_rgba = img.convert('RGBA')
        arr = np.array(img_rgba)
        
        # Check corner pixels
        h, w, _ = arr.shape
        corners = [arr[0, 0], arr[0, w-1], arr[h-1, 0], arr[h-1, w-1]]
        
        # Alpha check
        has_transparency = np.any(arr[:, :, 3] < 250)
        
        # Average corner RGB
        corner_rgb = np.mean([c[:3] for c in corners], axis=0)
        corner_alpha = np.mean([c[3] for c in corners])
        
        bg_desc = ""
        if corner_alpha < 50:
            bg_desc = "Transparent BG"
        elif np.mean(corner_rgb) > 200:
            bg_desc = f"White/Light BG (avg {int(np.mean(corner_rgb))})"
        elif np.mean(corner_rgb) < 50:
            bg_desc = f"Dark/Black BG (avg {int(np.mean(corner_rgb))})"
        else:
            bg_desc = f"Colored BG (R:{int(corner_rgb[0])} G:{int(corner_rgb[1])} B:{int(corner_rgb[2])})"
            
        print(f"{f:42} | Transp: {str(has_transparency):5} | {bg_desc}")
