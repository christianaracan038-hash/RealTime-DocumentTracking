# Office images

Served as-is at `/images/<name>` — no build step. Anything dropped here
is available immediately; nothing needs rebuilding.

| File | Where it appears |
|---|---|
| `bir-logo.png` | Login screen, sidebar, and the printed reference slip |
| `office-logo.png` | Login screen and sidebar |
| `login-bg.jpg` | Behind the login screen, blurred and darkened |

A missing file is never requested: `HandleInertiaRequests` checks which
of these exist and tells the page, so the browser logs no 404s.

## Keep them small

These load on every page, often on a phone on mobile data. The logos are
displayed at 40–80px, so 160px is already twice what any screen needs,
and the background is blurred, so detail beyond ~1400px is invisible.

The current files are 15 KB, 8 KB and 135 KB. If you replace one, aim
for the same order of magnitude — the originals were 1.0 MB, 240 KB and
1.9 MB, which is 20× the whole rest of the page.

Resizing with ffmpeg, which is already on the machine:

    # logo: 160px, transparency kept, palette reduced
    ffmpeg -i new-logo.png -vf "scale=160:-1:flags=lanczos,split[a][b];\
    [a]palettegen=reserve_transparent=1:max_colors=256[p];\
    [b][p]paletteuse=alpha_threshold=128" -compression_level 100 out.png

    # background: 1400px JPEG
    ffmpeg -i new-bg.png -vf "scale=1400:-1:flags=lanczos" -q:v 7 out.jpg
