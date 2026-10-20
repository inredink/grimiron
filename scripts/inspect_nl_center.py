from PIL import Image
import numpy as np

with Image.open(r"c:\Users\patri\Pictures\Warhammer Art\Symbols\Night Lords Symbol.jpg") as img:
    arr = np.array(img.convert('RGB'))
    h, w, _ = arr.shape
    center_box = arr[h//2-30:h//2+30, w//2-30:w//2+30]
    # Check what colors are in the center box
    unique_colors = np.unique(center_box.reshape(-1, 3), axis=0)
    print("Center box shape:", center_box.shape)
    print("Min RGB in center:", np.min(center_box, axis=(0,1)))
    print("Max RGB in center:", np.max(center_box, axis=(0,1)))
    # What are the darkest pixels in center box?
    darkest = center_box[center_box[:, :, 0] < 50]
    print(f"Pixels with R < 50 in center: {len(darkest)}")
    # Are there white/bone pixels?
    bright = center_box[np.all(center_box > 180, axis=2)]
    print(f"Pixels with RGB > 180 in center: {len(bright)}")
    # Wings: pixels with R > G + 30 and R > B + 30
    red_pixels = arr[(arr[:, :, 0] > arr[:, :, 1] + 30) & (arr[:, :, 0] > arr[:, :, 2] + 30)]
    print(f"Total red wing pixels: {len(red_pixels)} ({len(red_pixels)/(h*w)*100:.1f}%)")
