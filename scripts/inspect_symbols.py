import os
from PIL import Image

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
files = sorted(os.listdir(symbols_dir))

print(f"Total files: {len(files)}")
for f in files:
    path = os.path.join(symbols_dir, f)
    try:
        with Image.open(path) as img:
            print(f"{f:45} | Size: {img.size[0]:4}x{img.size[1]:4} | Mode: {img.mode:5}")
    except Exception as e:
        print(f"Error opening {f}: {e}")
