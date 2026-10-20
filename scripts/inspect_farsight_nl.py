from PIL import Image
import numpy as np

for f in ["Farsight Enclaves Symbol.png", "Night Lords Symbol.jpg"]:
    p = f"c:\\Users\\patri\\Pictures\\Warhammer Art\\Symbols\\{f}"
    with Image.open(p) as img:
        arr = np.array(img.convert('RGB'))
        print(f"\n--- {f} ---")
        print("Shape:", arr.shape)
        # Check corner colors
        print("Corners:", arr[0,0], arr[0,-1], arr[-1,0], arr[-1,-1])
        # Unique colors or histogram
        print("Sample row 10:", arr[10, ::20])
        print("Sample center row:", arr[arr.shape[0]//2, ::20])
