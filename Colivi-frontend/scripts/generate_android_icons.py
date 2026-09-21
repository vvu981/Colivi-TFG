import os
from PIL import Image, ImageDraw

def create_android_assets():
    source_path = 'Colivi-frontend/public/favicon.png'
    res_base = 'Colivi-frontend/android/app/src/main/res'
    
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source file not found: {source_path}")
    
    logo_src = Image.open(source_path).convert("RGBA")
    src_w, src_h = logo_src.size
    aspect = src_w / src_h

    # 1. Adaptive Foreground Icons (108dp base)
    # Safe mask is centered circle of 66dp (~61% of canvas).
    # Width ~ 56% ensures the entire logo fits safely without clipping.
    foreground_densities = {
        'mipmap-mdpi': 108,
        'mipmap-hdpi': 162,
        'mipmap-xhdpi': 216,
        'mipmap-xxhdpi': 324,
        'mipmap-xxxhdpi': 432
    }

    for folder, size in foreground_densities.items():
        out_dir = os.path.join(res_base, folder)
        os.makedirs(out_dir, exist_ok=True)
        
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        target_w = int(size * 0.56)
        target_h = int(target_w / aspect)
        
        scaled_logo = logo_src.resize((target_w, target_h), Image.Resampling.LANCZOS)
        offset_x = (size - target_w) // 2
        offset_y = (size - target_h) // 2
        canvas.paste(scaled_logo, (offset_x, offset_y), scaled_logo)
        
        out_path = os.path.join(out_dir, "ic_launcher_foreground.png")
        canvas.save(out_path, "PNG")
        print(f"Generated {out_path} ({size}x{size})")

    # 2. Legacy Launcher Icons (Square with rounded corners & Round)
    legacy_densities = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }

    for folder, size in legacy_densities.items():
        out_dir = os.path.join(res_base, folder)
        os.makedirs(out_dir, exist_ok=True)
        
        # Super-sample by 4x for smooth anti-aliased geometry
        ss = 4
        ss_size = size * ss
        
        # --- ic_launcher.png (Rounded rectangle) ---
        mask_rect = Image.new("L", (ss_size, ss_size), 0)
        draw_rect = ImageDraw.Draw(mask_rect)
        radius = int(ss_size * 0.20)
        draw_rect.rounded_rectangle([(0, 0), (ss_size - 1, ss_size - 1)], radius=radius, fill=255)
        
        bg_rect = Image.new("RGBA", (ss_size, ss_size), (255, 255, 255, 255))
        bg_rect.putalpha(mask_rect)
        
        target_w = int(ss_size * 0.74)
        target_h = int(target_w / aspect)
        scaled_logo_rect = logo_src.resize((target_w, target_h), Image.Resampling.LANCZOS)
        offset_x = (ss_size - target_w) // 2
        offset_y = (ss_size - target_h) // 2
        bg_rect.paste(scaled_logo_rect, (offset_x, offset_y), scaled_logo_rect)
        
        icon_square = bg_rect.resize((size, size), Image.Resampling.LANCZOS)
        out_square = os.path.join(out_dir, "ic_launcher.png")
        icon_square.save(out_square, "PNG")
        print(f"Generated {out_square} ({size}x{size})")

        # --- ic_launcher_round.png (Circular) ---
        mask_circle = Image.new("L", (ss_size, ss_size), 0)
        draw_circle = ImageDraw.Draw(mask_circle)
        draw_circle.ellipse([(0, 0), (ss_size - 1, ss_size - 1)], fill=255)
        
        bg_circle = Image.new("RGBA", (ss_size, ss_size), (255, 255, 255, 255))
        bg_circle.putalpha(mask_circle)
        
        target_w_round = int(ss_size * 0.62)
        target_h_round = int(target_w_round / aspect)
        scaled_logo_round = logo_src.resize((target_w_round, target_h_round), Image.Resampling.LANCZOS)
        offset_x_round = (ss_size - target_w_round) // 2
        offset_y_round = (ss_size - target_h_round) // 2
        bg_circle.paste(scaled_logo_round, (offset_x_round, offset_y_round), scaled_logo_round)
        
        icon_round = bg_circle.resize((size, size), Image.Resampling.LANCZOS)
        out_round = os.path.join(out_dir, "ic_launcher_round.png")
        icon_round.save(out_round, "PNG")
        print(f"Generated {out_round} ({size}x{size})")

    # 3. Splash Screens
    splash_screens = {
        'drawable': (480, 320),
        'drawable-land-mdpi': (480, 320),
        'drawable-land-hdpi': (800, 480),
        'drawable-land-xhdpi': (1280, 720),
        'drawable-land-xxhdpi': (1600, 960),
        'drawable-land-xxxhdpi': (1920, 1280),
        'drawable-port-mdpi': (320, 480),
        'drawable-port-hdpi': (480, 800),
        'drawable-port-xhdpi': (720, 1280),
        'drawable-port-xxhdpi': (960, 1600),
        'drawable-port-xxxhdpi': (1280, 1920),
    }

    for folder, (w, h) in splash_screens.items():
        out_dir = os.path.join(res_base, folder)
        os.makedirs(out_dir, exist_ok=True)
        
        splash_canvas = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        
        if w > h:
            # Landscape
            target_h = int(h * 0.32)
            target_w = int(target_h * aspect)
        else:
            # Portrait
            target_w = int(w * 0.46)
            target_h = int(target_w / aspect)
            
        scaled_logo = logo_src.resize((target_w, target_h), Image.Resampling.LANCZOS)
        offset_x = (w - target_w) // 2
        offset_y = (h - target_h) // 2
        splash_canvas.paste(scaled_logo, (offset_x, offset_y), scaled_logo)
        
        out_path = os.path.join(out_dir, "splash.png")
        splash_canvas.save(out_path, "PNG")
        print(f"Generated {out_path} ({w}x{h})")

if __name__ == "__main__":
    create_android_assets()
    print("All Android assets generated successfully.")
