import os
from PIL import Image

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
files = sorted(os.listdir(symbols_dir))
print(f"Total files in folder: {len(files)}")
for f in files:
    fp = os.path.join(symbols_dir, f)
    im = Image.open(fp)
    print(f"{f:42} | Size: {im.size[0]:>5}x{im.size[1]:<5} | Mode: {im.mode}")
