import math
import os
from PIL import Image, ImageDraw

def create_monarch_icon(size=2048, transparent_bg=False, scale_factor=1.0, is_monochrome=False):
    # Supersampled high-res canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = size / 2.0
    cy = size / 2.0
    # Scale from 80x80 SVG reference to `size`
    s = (size / 80.0) * scale_factor

    # Colors
    c_bg = (11, 6, 17, 255)
    c_tint = (217, 130, 165, 255)       # #D982A5
    c_tint_light = (240, 188, 210, 255) # #F0BCD2
    c_tint_deep = (160, 64, 112, 255)   # #A04070
    c_white = (255, 255, 255, 255)
    c_dark_disc = (21, 13, 29, 255)     # #150D1D
    c_casing = (8, 5, 16, 255)          # #080510

    if is_monochrome:
        c_tint = (255, 255, 255, 255)
        c_tint_light = (255, 255, 255, 230)
        c_tint_deep = (255, 255, 255, 180)
        c_white = (255, 255, 255, 255)
        c_dark_disc = (0, 0, 0, 0)
        c_casing = (0, 0, 0, 255)

    if not transparent_bg:
        # Fill base background
        draw.rectangle([0, 0, size, size], fill=c_bg)

        # Soft radial mana glow behind disc
        glow_steps = 40
        max_r = 39.0 * s
        for i in range(glow_steps, 0, -1):
            r = max_r * (i / glow_steps)
            alpha = int(45 * (1.0 - (i / glow_steps)))
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(217, 130, 165, alpha))

        # Circular Obsidian Disc (r = 37 in SVG)
        r_disc = 37.0 * s
        draw.ellipse([cx - r_disc, cy - r_disc, cx + r_disc, cy + r_disc], fill=c_dark_disc, outline=c_tint, width=int(round(1.5 * s)))

        # Inner Concentric Hairline Ring (r = 34.5 in SVG)
        r_inner = 34.5 * s
        draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], outline=(255, 255, 255, 30), width=int(round(0.8 * s)))

    def p(x, y):
        # Maps (x, y) in [0, 80] relative to (40, 42) center
        return (cx + (x - 40.0) * s, cy + (y - 42.0) * s)

    # 4 Diagonal Orbital Telemetry Radar Ticks
    tick_w = int(max(2, round(2.0 * s)))
    draw.line([p(12.5, 14.5), p(16.5, 18.5)], fill=c_tint_light, width=tick_w)
    draw.line([p(67.5, 14.5), p(63.5, 18.5)], fill=c_tint_light, width=tick_w)
    draw.line([p(12.5, 69.5), p(16.5, 65.5)], fill=c_tint_light, width=tick_w)
    draw.line([p(67.5, 69.5), p(63.5, 65.5)], fill=c_tint_light, width=tick_w)

    # Left energy arcs
    arc_w = int(max(2, round(2.4 * s)))
    # Sample cubic bezier for Left shockwave arc: M 10 23 C 3 33, 3 51, 10 61
    def bezier_pts(p0, p1, p2, p3, steps=30):
        pts = []
        for step in range(steps + 1):
            t = step / float(steps)
            bx = (1-t)**3 * p0[0] + 3*(1-t)**2*t * p1[0] + 3*(1-t)*t**2 * p2[0] + t**3 * p3[0]
            by = (1-t)**3 * p0[1] + 3*(1-t)**2*t * p1[1] + 3*(1-t)*t**2 * p2[1] + t**3 * p3[1]
            pts.append(p(bx, by))
        return pts

    left_arc = bezier_pts((10, 23), (3, 33), (3, 51), (10, 61))
    draw.line(left_arc, fill=c_tint_light, width=arc_w)

    right_arc = bezier_pts((70, 23), (77, 33), (77, 51), (70, 61))
    draw.line(right_arc, fill=c_tint_light, width=arc_w)

    # Left and Right energy wing spikes
    spike_w = int(max(2, round(2.0 * s)))
    draw.line([p(12, 20), p(6, 15)], fill=c_tint_light, width=spike_w)
    draw.line([p(8, 42), p(2, 42)], fill=c_tint_light, width=spike_w)
    draw.line([p(12, 64), p(6, 69)], fill=c_tint_light, width=spike_w)

    draw.line([p(68, 20), p(74, 15)], fill=c_tint_light, width=spike_w)
    draw.line([p(72, 42), p(78, 42)], fill=c_tint_light, width=spike_w)
    draw.line([p(68, 64), p(74, 69)], fill=c_tint_light, width=spike_w)

    # Wing dots
    def draw_dot(pt, r, col):
        pos = p(*pt)
        rad = r * s
        draw.ellipse([pos[0]-rad, pos[1]-rad, pos[0]+rad, pos[1]+rad], fill=col)

    draw_dot((4.5, 24), 1.8, c_white)
    draw_dot((3.5, 59), 1.6, c_tint_light)
    draw_dot((75.5, 24), 1.8, c_white)
    draw_dot((76.5, 59), 1.6, c_tint_light)

    # Top Crown / Chevron
    crown_pts = [p(28, 22), p(40, 12), p(52, 22)]
    draw.line(crown_pts, fill=c_casing, width=int(round(5.4 * s)), joint="curve")
    draw.line(crown_pts, fill=c_white, width=int(round(3.2 * s)), joint="curve")

    # Crown Diamond
    diamond_pts = [p(40, 16.5), p(43.5, 21), p(40, 25.5), p(36.5, 21)]
    draw.polygon(diamond_pts, fill=c_tint_light, outline=c_casing)

    # Central Bar
    bar_outer_tl = p(22, 38.2)
    bar_outer_br = p(58, 45.8)
    draw.rounded_rectangle([bar_outer_tl, bar_outer_br], radius=int(3.8 * s), fill=c_casing)

    bar_inner_tl = p(23, 39.4)
    bar_inner_br = p(57, 44.6)
    draw.rounded_rectangle([bar_inner_tl, bar_inner_br], radius=int(2.6 * s), fill=c_white)

    # Inner Angled Weight Plates
    l_in_tl = p(19, 26)
    l_in_br = p(26.2, 58)
    draw.rounded_rectangle([l_in_tl, l_in_br], radius=int(3.2 * s), fill=c_tint_deep, outline=c_casing, width=int(max(1, 1.6 * s)))

    r_in_tl = p(53.8, 26)
    r_in_br = p(61, 58)
    draw.rounded_rectangle([r_in_tl, r_in_br], radius=int(3.2 * s), fill=c_tint_deep, outline=c_casing, width=int(max(1, 1.6 * s)))

    # Outer Heavy Armored Weight Plates
    l_out_tl = p(11.5, 21)
    l_out_br = p(18.7, 63)
    draw.rounded_rectangle([l_out_tl, l_out_br], radius=int(3.5 * s), fill=c_tint, outline=c_white, width=int(max(1, 1.5 * s)))

    r_out_tl = p(61.3, 21)
    r_out_br = p(68.5, 63)
    draw.rounded_rectangle([r_out_tl, r_out_br], radius=int(3.5 * s), fill=c_tint, outline=c_white, width=int(max(1, 1.5 * s)))

    # Glowing Core Slits
    slit_l_tl = p(14.3, 28)
    slit_l_br = p(16.1, 56)
    draw.rounded_rectangle([slit_l_tl, slit_l_br], radius=int(0.9 * s), fill=c_white)

    slit_r_tl = p(63.9, 28)
    slit_r_br = p(65.7, 56)
    draw.rounded_rectangle([slit_r_tl, slit_r_br], radius=int(0.9 * s), fill=c_white)

    # Central AI Neural Power Core (Diamond Reactor)
    reactor_pts = [p(40, 29.5), p(48.5, 42), p(40, 54.5), p(31.5, 42)]
    draw.polygon(reactor_pts, fill=c_tint, outline=c_casing)

    inner_reactor = [p(40, 31.5), p(47, 42), p(40, 52.5), p(33, 42)]
    draw.polygon(inner_reactor, fill=c_tint_light, outline=c_white)

    draw_dot((40, 42), 2.8, c_white)

    return img

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, 'assets', 'images')
    os.makedirs(assets_dir, exist_ok=True)

    print("Generating authentic Monarch Cyber-Dumbbell circular crest icons...")

    # 1. Main App Icon (1024x1024)
    icon_1024 = create_monarch_icon(size=1024, transparent_bg=False, scale_factor=0.92)
    icon_path = os.path.join(assets_dir, 'icon.png')
    icon_1024.save(icon_path, format="PNG")
    print(f"Saved: {icon_path}")

    # 2. Splash Icon (512x512)
    splash_512 = create_monarch_icon(size=512, transparent_bg=False, scale_factor=0.92)
    splash_path = os.path.join(assets_dir, 'splash-icon.png')
    splash_512.save(splash_path, format="PNG")
    print(f"Saved: {splash_path}")

    # 3. Android Adaptive Background (512x512 solid obsidian)
    bg_img = Image.new("RGBA", (512, 512), (11, 6, 17, 255))
    bg_path = os.path.join(assets_dir, 'android-icon-background.png')
    bg_img.save(bg_path, format="PNG")
    print(f"Saved: {bg_path}")

    # 4. Android Adaptive Foreground (512x512 transparent with scaled emblem)
    fg_img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    emblem = create_monarch_icon(size=512, transparent_bg=False, scale_factor=0.88)
    safe_size = int(512 * 0.72)
    emblem_resized = emblem.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
    offset = int((512 - safe_size) / 2)
    fg_img.paste(emblem_resized, (offset, offset), emblem_resized)
    fg_path = os.path.join(assets_dir, 'android-icon-foreground.png')
    fg_img.save(fg_path, format="PNG")
    print(f"Saved: {fg_path}")

    # 5. Android Adaptive Monochrome (432x432)
    mono_img = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
    mono_emblem = create_monarch_icon(size=432, transparent_bg=False, scale_factor=0.88, is_monochrome=True)
    mono_safe = int(432 * 0.70)
    mono_resized = mono_emblem.resize((mono_safe, mono_safe), Image.Resampling.LANCZOS)
    m_offset = int((432 - mono_safe) / 2)
    mono_img.paste(mono_resized, (m_offset, m_offset), mono_resized)
    mono_path = os.path.join(assets_dir, 'android-icon-monochrome.png')
    mono_img.save(mono_path, format="PNG")
    print(f"Saved: {mono_path}")

    print("Successfully regenerated all Monarch Cyber icons!")

if __name__ == '__main__':
    main()
