"""Check if BoxReveal is deployed in the frontend bundle."""
import re, urllib.request

# Fetch HTML
html = urllib.request.urlopen('https://exo-genesis.vercel.app/').read().decode()
scripts = re.findall(r'src="([^"]+\.js)"', html)
print(f'Found {len(scripts)} JS bundles:')
for s in scripts:
    url = f'https://exo-genesis.vercel.app{s}'
    js = urllib.request.urlopen(url).read().decode('utf-8', errors='replace')
    has_box = 'BoxReveal' in js
    has_hud = 'HudBar' in js
    has_init = 'initAuth' in js
    print(f'  {s.split("/")[-1]}: BoxReveal={has_box} HudBar={has_hud} initAuth={has_init}')
