import os
from PIL import Image
import numpy as np

p = r"c:\Users\patri\Pictures\Warhammer Art\Symbols\T'au Sept Symbol.png"
with Image.open(p) as img:
    arr = np.array(img)
    print("arr shape:", arr.shape)
    print("arr dtype:", arr.dtype)
    # Check if there are RGB differences or if it's black/white
    print("arr[128, 128]:", arr[128, 128])
    print("arr[64, 64]:", arr[64, 64])
    print("arr[10, 10]:", arr[10, 10])
    # Unique RGB values
    print("Unique RGBs in arr:", np.unique(arr[:, :, :3].reshape(-1, 3), axis=0)[:5])
    # Unique Alphas
    print("Unique Alphas in arr:", np.unique(arr[:, :, 3]))
