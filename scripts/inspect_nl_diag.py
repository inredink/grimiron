from PIL import Image
import numpy as np

with Image.open(r"c:\Users\patri\Pictures\Warhammer Art\Symbols\Night Lords Symbol.jpg") as img:
    arr = np.array(img.convert('RGB'))
    # Save a small color sample analysis
    h, w, _ = arr.shape
    print("Dimensions:", h, w)
    # Check pixels along diagonal
    diag = [arr[i, i] for i in range(0, min(h, w), 20)]
    for i, c in enumerate(diag):
        print(f"Sample {i*20}: R={c[0]}, G={c[1]}, B={c[2]}")
