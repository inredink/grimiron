import os, sys
import numpy as np
from PIL import Image

sys.path.append('scripts')
from verify_file_mappings import file_mappings

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"

print("Auditing all 60 images...")
for filename, meta in file_mappings.items():
    sym_id = meta["id"]
    filepath = os.path.join(symbols_dir, filename)
    with Image.open(filepath) as im:
        w, h = im.size
        mode = im.mode
        print(f"[{sym_id}] ({filename}) -> size={w}x{h}, mode={mode}")
