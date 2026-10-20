import os
import numpy as np
from PIL import Image

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
files = sorted(os.listdir(symbols_dir))

def get_mask(img_path):
    with Image.open(img_path) as img:
        img_rgba = img.convert('RGBA')
        arr = np.array(img_rgba)
        h, w, _ = arr.shape
        
        # 1. If alpha channel has meaningful transparency, use alpha!
        alpha = arr[:, :, 3]
        if np.any(alpha < 200) and np.any(alpha > 50):
            # Transparent image: mask is where alpha > 128
            mask = alpha > 128
            return mask, "alpha"
            
        # 2. Check corners to find background color
        corners = [arr[0, 0, :3], arr[0, w-1, :3], arr[h-1, 0, :3], arr[h-1, w-1, :3]]
        bg_rgb = np.mean(corners, axis=0)
        
        # Check difference from bg
        diff_from_bg = np.linalg.norm(arr[:, :, :3].astype(float) - bg_rgb, axis=2)
        
        # If background is bright (white/light grey)
        if np.mean(bg_rgb) > 180:
            # Foreground is darker than background
            # Use grayscale threshold or difference from bg
            gray = np.array(img.convert('L'))
            # Auto threshold using mean or Otsu
            threshold = min(220, max(50, np.mean(gray) * 0.9))
            mask = gray < threshold
            return mask, f"light_bg (thr={int(threshold)})"
            
        elif np.mean(bg_rgb) < 60:
            # Dark background
            gray = np.array(img.convert('L'))
            threshold = max(30, min(150, np.mean(gray) * 1.1))
            mask = gray > threshold
            return mask, f"dark_bg (thr={int(threshold)})"
        else:
            # Colored background
            # Distance from corner color
            diff = np.linalg.norm(arr[:, :, :3].astype(float) - bg_rgb, axis=2)
            threshold = 30
            mask = diff > threshold
            return mask, f"colored_bg (thr={threshold})"

for f in files:
    path = os.path.join(symbols_dir, f)
    mask, method = get_mask(path)
    # Check coverage of mask (percentage of image that is foreground)
    pct = np.mean(mask) * 100
    print(f"{f:42} | {method:20} | Coverage: {pct:5.1f}%")
