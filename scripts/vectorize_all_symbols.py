import os
import json
import re
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import label
import potrace

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
output_dir = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\vectorized"
app_assets_dir = r"C:\Users\patri\.gemini\antigravity\scratch\grimiron\assets\symbols"

os.makedirs(output_dir, exist_ok=True)
os.makedirs(app_assets_dir, exist_ok=True)

from verify_file_mappings import file_mappings

def curves_to_svg(path, width, height, fill="white"):
    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">'
    ]
    path_d = []
    for curve in path.curves:
        fs = curve.start_point
        path_d.append(f'M {fs.x:.2f},{fs.y:.2f}')
        for seg in curve.segments:
            if seg.is_corner:
                path_d.append(f'L {seg.c.x:.2f},{seg.c.y:.2f} L {seg.end_point.x:.2f},{seg.end_point.y:.2f}')
            else:
                path_d.append(f'C {seg.c1.x:.2f},{seg.c1.y:.2f} {seg.c2.x:.2f},{seg.c2.y:.2f} {seg.end_point.x:.2f},{seg.end_point.y:.2f}')
        path_d.append('Z')
    d_str = ' '.join(path_d)
    svg_parts.append(f'  <path d="{d_str}" fill="{fill}" fill-rule="evenodd" />')
    svg_parts.append('</svg>')
    return '\n'.join(svg_parts)

def extract_mask(filename, filepath):
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

def crop_and_pad(mask, pad_pct=0.08, target_size=512):
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not np.any(rows) or not np.any(cols):
        return np.zeros((target_size, target_size), dtype=bool)

    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]

    cropped = mask[ymin:ymax+1, xmin:xmax+1]
    ch, cw = cropped.shape

    max_dim = int(target_size * (1 - 2 * pad_pct))
    scale = min(max_dim / max(1, ch), max_dim / max(1, cw))
    nw = max(1, int(cw * scale))
    nh = max(1, int(ch * scale))

    im_crop = Image.fromarray(cropped.astype(np.uint8) * 255)
    im_resized = im_crop.resize((nw, nh), Image.Resampling.LANCZOS)
    arr_resized = np.array(im_resized) > 128

    canvas = np.zeros((target_size, target_size), dtype=bool)
    oy = (target_size - nh) // 2
    ox = (target_size - nw) // 2
    canvas[oy:oy+nh, ox:ox+nw] = arr_resized
    return canvas

def process_all():
    summary_report = []

    for filename, meta in file_mappings.items():
        sym_id = meta["id"]
        filepath = os.path.join(symbols_dir, filename)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue

        mask = extract_mask(filename, filepath)
        std_mask = crop_and_pad(mask, pad_pct=0.08, target_size=512)

        # 1. Vectorize with potrace
        bm = potrace.Bitmap(std_mask)
        path = bm.trace()

        # Save SVGs in brain output_dir
        svg_white = curves_to_svg(path, 512, 512, fill="white")
        svg_black = curves_to_svg(path, 512, 512, fill="black")

        with open(os.path.join(output_dir, f"{sym_id}.svg"), "w", encoding="utf-8") as f:
            f.write(svg_white)
        with open(os.path.join(output_dir, f"{sym_id}_black.svg"), "w", encoding="utf-8") as f:
            f.write(svg_black)

        # 2. Generate PNG variants
        # White on transparent
        rgba_white = np.zeros((512, 512, 4), dtype=np.uint8)
        rgba_white[std_mask] = [255, 255, 255, 255]
        im_white = Image.fromarray(rgba_white)
        im_white.save(os.path.join(output_dir, f"{sym_id}_white.png"))
        im_white.save(os.path.join(app_assets_dir, f"{sym_id}.png"))

        # Black on transparent
        rgba_black = np.zeros((512, 512, 4), dtype=np.uint8)
        rgba_black[std_mask] = [0, 0, 0, 255]
        im_black = Image.fromarray(rgba_black)
        im_black.save(os.path.join(output_dir, f"{sym_id}_black.png"))
        im_black.save(os.path.join(app_assets_dir, f"{sym_id}_black.png"))

        # Dark preview (#141922 dark background)
        bg_dark = np.full((512, 512, 3), [20, 25, 34], dtype=np.uint8)
        bg_dark[std_mask] = [0, 230, 240] # Cyan sci-fi preview accent
        im_prev = Image.fromarray(bg_dark)
        im_prev.save(os.path.join(output_dir, f"{sym_id}_preview.png"))

        coverage = np.mean(std_mask) * 100
        summary_report.append({
            "id": sym_id,
            "name": meta["name"],
            "filename": filename,
            "coverage": f"{coverage:.1f}%",
            "curves": len(path.curves)
        })
        print(f"[{sym_id:25}] Processed | Curves: {len(path.curves):3d} | Coverage: {coverage:4.1f}% | Source: {filename}")

    # Save manifest
    manifest_path = os.path.join(output_dir, "vectorization_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(summary_report, f, indent=2)

    print(f"\nSuccessfully vectorized and generated PNGs for all {len(summary_report)} symbols!")

if __name__ == "__main__":
    process_all()
