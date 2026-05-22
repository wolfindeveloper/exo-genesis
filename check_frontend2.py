"""Check for BoxReveal strings in deployed frontend bundle."""
import urllib.request

html = urllib.request.urlopen('https://exo-genesis.vercel.app/').read().decode()

import re
for src in re.findall(r'src="([^"]+\.js)"', html):
    url = f'https://exo-genesis.vercel.app{src}'
    js = urllib.request.urlopen(url).read().decode('utf-8', errors='replace')
    markers = ['стартовый набор', 'Поздравляем', 'Открываем бокс', 'BoxReveal', 'HudBar', 'clearBoxRewards']
    for m in markers:
        if m in js:
            print(f'FOUND: "{m}" in {src.split("/")[-1]}')
    # Check if not found
    if not any(m in js for m in markers):
        print(f'NONE of the markers found in {src.split("/")[-1]}')
