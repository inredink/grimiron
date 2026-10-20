import os
import numpy as np
from PIL import Image

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
files = sorted(os.listdir(symbols_dir))

print("Classifying extraction methods for all 60 files:")
for f in files:
    p = os.path.join(symbols_dir, f)
    with Image.open(p) as img:
        img_rgba = img.convert('RGBA')
        arr = np.array(img_rgba)
        h, w, _ = arr.shape
        
        # Check transparency
        alpha = arr[:, :, 3]
        has_alpha = np.any(alpha < 50) and np.any(alpha > 200)
        
        # Check corner color
        corners = [arr[0, 0, :3], arr[0, w-1, :3], arr[h-1, 0, :3], arr[h-1, w-1, :3]]
        corner_rgb = np.mean(corners, axis=0)
        corner_lum = 0.299*corner_rgb[0] + 0.587*corner_rgb[1] + 0.114*corner_rgb[2]
        
        # Check center color
        center = arr[h//4:3*h//4, w//4:3*w//4, :3]
        center_rgb = np.mean(center, axis=(0,1))
        center_lum = 0.299*center_rgb[0] + 0.587*center_rgb[1] + 0.114*center_rgb[2]
        
        # Gray
        gray = np.array(img.convert('L'))
        
        print(f"{f:40} | HasAlpha: {str(has_alpha):5} | CornerLum: {corner_lum:5.1f} | CenterLum: {center_lum:5.1f}")
