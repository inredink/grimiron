from PIL import Image
import numpy as np

with Image.open(r"c:\Users\patri\Pictures\Warhammer Art\Symbols\Night Lords Symbol.jpg") as img:
    arr = np.array(img.convert('RGB'))
    # In Night Lords, the wings are red. What is the skull?
    # Let's check lines/edges around the center
    # Is the skull outlined with black/dark?
    # Let's check center:
    h, w, _ = arr.shape
    center_y, center_x = h//2, w//2
    # Check pixels in center y
    row = arr[center_y]
    # Check where R != G or B
    sat = np.max(arr, axis=2).astype(int) - np.min(arr, axis=2).astype(int)
    print("Max saturation in image:", np.max(sat))
    # Red wings have high saturation in red: (arr[:, :, 0] > arr[:, :, 1] + 25)
    # The skull: what is the skull in Night Lords?
    # In Warhammer 40k, the Night Lords symbol is a winged skull:
    # A skull (white/grey) flanked by red bat wings.
    # What color is the background vs skull?
    # The background is a blue-grey gradient: B is highest in background!
    # In background: arr[:, :, 2] > arr[:, :, 0]
    # In skull: is B > R or is skull neutral / white?
    # Let's test:
    # Background has (B > R + 10) and (G > R)
    is_blue_bg = (arr[:, :, 2].astype(int) > arr[:, :, 0].astype(int) + 12) & (arr[:, :, 1].astype(int) > arr[:, :, 0].astype(int) + 2)
    # If not blue background, it's the emblem (wings + skull)!
    emblem_mask = ~is_blue_bg
    print(f"Emblem coverage (~is_blue_bg): {np.mean(emblem_mask)*100:.1f}%")
    
    # Save preview
    prev = np.full((h, w, 3), 30, dtype=np.uint8)
    prev[emblem_mask] = [255, 255, 255]
    Image.fromarray(prev).save(r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\scratch\preview_test\NL_emblem_test.png")
