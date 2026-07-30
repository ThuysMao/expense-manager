from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color='#7C3AED')
    d = ImageDraw.Draw(img)
    # Just draw a simple white circle or text as placeholder if no emoji font
    # Draw a white circle
    margin = size * 0.2
    d.ellipse([margin, margin, size-margin, size-margin], fill='#FFFFFF')
    
    # Save
    os.makedirs('icons', exist_ok=True)
    img.save(f'icons/{filename}')

create_icon(192, 'icon-192.png')
create_icon(512, 'icon-512.png')
print("Icons generated!")
