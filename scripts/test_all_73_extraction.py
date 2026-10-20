import os
from PIL import Image, ImageFilter
import numpy as np

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"

def get_mask(filename):
    filepath = os.path.join(symbols_dir, filename)
    with Image.open(filepath) as img:
        arr = np.array(img.convert('RGB'))
        gray = np.array(img.convert('L'))
        h, w = gray.shape
        
        if "Kabal of the Black Heart" in filename:
            return (arr[:, :, 0] < 50) & (arr[:, :, 1] < 50) & (arr[:, :, 2] < 50)
        elif "Cult of Strife" in filename:
            return gray < 80
        elif "Blood Axes" in filename:
            is_axe_red = (arr[:, :, 0].astype(int) > arr[:, :, 1].astype(int) + 35) & (arr[:, :, 0].astype(int) > arr[:, :, 2].astype(int) + 35)
            is_axe_dark = (arr[:, :, 0] < 70) & (arr[:, :, 1] < 70) & (arr[:, :, 2] < 70)
            return is_axe_red | is_axe_dark
        elif "Nihilakh Dynasty" in filename:
            blur = np.array(img.convert('L').filter(ImageFilter.GaussianBlur(radius=6))).astype(float)
            diff = gray.astype(float) - blur
            return diff > 6
        elif "Hosts of Slaanesh" in filename:
            return gray > 45
        elif "Night Lords" in filename:
            if img.mode == 'RGBA':
                return np.array(img)[:, :, 3] > 50
            return gray < 100
        elif "Ultramarines" in filename:
            from scipy.ndimage import label
            is_blue = (arr[:, :, 2].astype(int) > arr[:, :, 0].astype(int) + 50)
            ymin, ymax = np.where(np.any(is_blue, axis=1))[0][[0, -1]]
            xmin, xmax = np.where(np.any(is_blue, axis=0))[0][[0, -1]]
            gray_arr = np.mean(arr, axis=2)
            omega_mask = np.zeros_like(is_blue)
            omega_mask[ymin+5:ymax-5, xmin+5:xmax-5] = gray_arr[ymin+5:ymax-5, xmin+5:xmax-5] > 180
            lbl, n = label(omega_mask)
            return (lbl == np.argmax([0] + [np.sum(lbl == i) for i in range(1, n+1)]))
        elif "Astra Militarum Symbol.png" in filename:
            return gray < 80
        elif "Adeptus Custodes Symbol.png" in filename:
            return gray < 90
        elif "Adeptus Mechanicus Symbol.png" in filename:
            return gray < 150
        elif "Grey Knights Symbol.jpg" in filename:
            return gray < 180
        elif "Heretic Astartes Symbol.png" in filename:
            return gray < 180
        elif "Thousand Sons Symbol.png" in filename:
            return gray < 180
        elif "World Eaters Symbol.jpg" in filename:
            return gray < 180
        elif "Chaos Daemons Symbol.jpg" in filename:
            return gray < 180
        elif "Aeldari Symbol.png" in filename:
            return gray < 180
        elif "Necron Symbol.jpg" in filename:
            v = np.max(arr, axis=2)
            v[0, :] = 0
            v[-1, :] = 0
            v[:, 0] = 0
            v[:, -1] = 0
            return v > 40
        elif "Ork Symbol.jpg" in filename:
            return gray < 180
        elif "Tyranid Symbol.jpg" in filename:
            return gray < 180
        elif "Genestealer Cult Symbol.png" in filename:
            return gray < 150
        elif "Adepta Sororitas symbol" in filename:
            return (arr[:,:,0] < 70) & (arr[:,:,1] < 70) & (arr[:,:,2] < 70)
        elif "Blood Angels" in filename:
            return (arr[:,:,0] < 80)
        elif "Cadian Shock Troops" in filename:
            return gray > 130
        elif "Salamanders" in filename:
            return (arr[:,:,0] > 160) & (arr[:,:,1] > 160)
        elif "Farsight Enclaves" in filename:
            return gray < 100
        elif "Order of the Valorous Heart" in filename:
            return gray < 100
        elif "The Bladed Cog" in filename:
            return gray < 70
        else:
            # Check transparency first
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img_rgba = img.convert('RGBA')
                alpha = np.array(img_rgba)[:, :, 3]
                if np.any(alpha < 50) and np.any(alpha > 200):
                    m = alpha > 100
                    if "Sept" in filename:
                        cutouts = (gray > 200) & (alpha > 100)
                        if np.any(cutouts):
                            m = m & (~cutouts)
                    return m
            # Corner checking
            corners = [arr[0, 0, :3], arr[0, w-1, :3], arr[h-1, 0, :3], arr[h-1, w-1, :3]]
            corner_rgb = np.mean(corners, axis=0)
            corner_lum = 0.299*corner_rgb[0] + 0.587*corner_rgb[1] + 0.114*corner_rgb[2]
            if corner_lum > 180:
                thr = min(220, max(50, np.mean(gray) * 0.88))
                return gray < thr
            elif corner_lum < 55:
                thr = max(35, min(160, np.mean(gray) * 1.15))
                return gray > thr
            else:
                diff = np.linalg.norm(arr.astype(float) - corner_rgb, axis=2)
                return diff > 35

print("Testing all 73 symbols extraction...")
files = sorted(os.listdir(symbols_dir))
for f in files:
    m = get_mask(f)
    cov = np.mean(m) * 100
    rows = np.any(m, axis=1)
    cols = np.any(m, axis=0)
    if not np.any(rows) or not np.any(cols):
        print(f"FAILED EMPTY: {f}")
    elif cov < 1.0:
        print(f"SUSPICIOUSLY LOW: {f} ({cov:.2f}%)")
    elif cov > 65.0:
        print(f"SUSPICIOUSLY HIGH: {f} ({cov:.2f}%)")
    else:
        print(f"OK: {f:40} | Coverage: {cov:5.1f}%")
