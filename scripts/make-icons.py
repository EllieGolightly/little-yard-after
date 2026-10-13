"""Reproduce home-screen icons from the game's existing house-and-leaf motif.
Run locally with Python + Pillow; generated PNGs are committed for deployment.
"""
from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parent.parent / 'public'
scale = 4
im = Image.new('RGB', (512*scale,512*scale), '#f4f0e2')
d = ImageDraw.Draw(im)
def poly(points,fill): d.polygon([(int(x*scale),int(y*scale)) for x,y in points],fill=fill)
def line(points,fill,width):
    d.line([(int(x*scale),int(y*scale)) for x,y in points], fill=fill,width=int(width*scale),joint='curve')
poly([(134,246),(256,133),(378,246),(378,374),(134,374)],'#9baa7b')
line([(110,253),(256,117),(402,253)],'#687951',24)
for x,y in [(110,253),(402,253)]: d.ellipse(((x-12)*scale,(y-12)*scale,(x+12)*scale,(y+12)*scale),fill='#687951')
poly([(224,374),(224,274),(293,274),(293,374)],'#f4e1ac')
line([(128,382),(385,382)],'#687951',17)
d.ellipse((102*scale,267*scale,168*scale,351*scale),fill='#c0cc99')
line([(146,351),(119,293)],'#9baa7b',4)
for name,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable-512.png',512),('apple-touch-icon.png',180)]:
    im.resize((size,size),Image.Resampling.LANCZOS).save(out/name)
print('Home-screen icons generated.')
