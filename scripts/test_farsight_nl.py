from PIL import Image
import numpy as np

# Farsight
with Image.open(r"c:\Users\patri\Pictures\Warhammer Art\Symbols\Farsight Enclaves Symbol.png") as img:
    arr = np.array(img.convert('RGB'))
    gray = np.array(img.convert('L'))
    # Emblem is the black shapes
    mask_farsight = gray < 100
    print(f"Farsight mask coverage (gray < 100): {np.mean(mask_farsight)*100:.1f}%")
    # Save preview
    prev = np.full(gray.shape + (3,), 30, dtype=np.uint8)
    prev[mask_farsight] = [255, 255, 255]
    Image.fromarray(prev).save(r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\scratch\preview_test\Farsight_test.png")

# Night Lords
with Image.open(r"c:\Users\patri\Pictures\Warhammer Art\Symbols\Night Lords Symbol.jpg") as img:
    arr = np.array(img.convert('RGB'))
    gray = np.array(img.convert('L'))
    # Emblem is bat wings + skull
    # Background is blueish: B > R and G > R
    is_bg = (arr[:, :, 2].astype(int) > arr[:, :, 0].astype(int) + 15) & (arr[:, :, 1].astype(int) > arr[:, :, 0].astype(int) + 5) & (gray > 140)
    mask_nl = ~is_bg
    print(f"Night Lords mask coverage (~is_bg): {np.mean(mask_nl)*100:.1f}%")
    prev = np.full(gray.shape + (3,), 30, dtype=np.uint8)
    prev[mask_nl] = [255, 255, 255]
    Image.fromarray(prev).save(r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\scratch\preview_test\Night_Lords_test.png")
