import sys
from PIL import Image, ImageOps

try:
    # Open the original logo
    original_logo = Image.open('./webrend/public/logo/logo.png')
    
    # Create a copy to preserve the original
    inverted_logo = original_logo.copy()
    
    # Check if the image has an alpha channel
    if original_logo.mode == 'RGBA':
        # Split the image into separate channels
        r, g, b, a = inverted_logo.split()
        
        # Invert the RGB channels (not the alpha)
        r = ImageOps.invert(r)
        g = ImageOps.invert(g)
        b = ImageOps.invert(b)
        
        # Merge channels back together
        inverted_logo = Image.merge('RGBA', (r, g, b, a))
    else:
        # If no alpha channel, just invert the whole image
        inverted_logo = ImageOps.invert(inverted_logo)
    
    # Create a black version by setting all RGB values to black but keeping alpha
    if original_logo.mode == 'RGBA':
        r, g, b, a = original_logo.split()
        black_logo = Image.merge('RGBA', (
            Image.new('L', r.size, 0),  # R=0
            Image.new('L', g.size, 0),  # G=0
            Image.new('L', b.size, 0),  # B=0
            a  # Keep original alpha
        ))
    else:
        black_logo = Image.new(original_logo.mode, original_logo.size, 0)
    
    # Save the inverted version
    inverted_logo.save('./webrend/public/logo/logo_inverted.png')
    
    # Save the black version
    black_logo.save('./webrend/public/logo/logo_black.png')
    
    print("Logo inverted and black versions created successfully.")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1) 