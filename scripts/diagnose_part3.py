import os
from PIL import Image
import numpy as np

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"

def ascii_test(filename, condition_fn, name):
    fp = os.path.join(symbols_dir, filename)
    im = Image.open(fp).convert('RGB')
    arr = np.array(im)
    mask = condition_fn(arr)
    im_sm = Image.fromarray(mask.astype(np.uint8)*255).resize((40, 20))
    print(f"\n=== {name} ({im.size}) | Coverage: {np.mean(mask)*100:.1f}% ===")
    for row in np.array(im_sm)>128:
        print(''.join('#' if x else ' ' for x in row))

# Adeptus Mechanicus
ascii_test("Adeptus Mechanicus Symbol.png", lambda a: np.mean(a, axis=2) < 150, "Adeptus Mechanicus")

# Chaos Daemons
ascii_test("Chaos Daemons Symbol.jpg", lambda a: np.mean(a, axis=2) < 150, "Chaos Daemons")

# Necron
ascii_test("Necron Symbol.jpg", lambda a: (a[:,:,1] > 60) | (np.mean(a, axis=2) > 60), "Necron (Main)")

# Ork
ascii_test("Ork Symbol.jpg", lambda a: np.mean(a, axis=2) < 150, "Ork (Main)")

# Tyranid
ascii_test("Tyranid Symbol.jpg", lambda a: np.mean(a, axis=2) < 150, "Tyranid (Main)")

# Genestealer Cult
ascii_test("Genestealer Cult Symbol.png", lambda a: np.mean(a, axis=2) < 150, "Genestealer Cult (Main)")

# Aeldari
ascii_test("Aeldari Symbol.png", lambda a: np.mean(a, axis=2) < 150, "Aeldari (Main)")
