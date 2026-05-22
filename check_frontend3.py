"""Check if BoxReveal and HudBar are actually rendered in the deployed App."""
import re, urllib.request

html = urllib.request.urlopen('https://exo-genesis.vercel.app/').read().decode()
for src in re.findall(r'src="([^"]+\.js)"', html):
    url = f'https://exo-genesis.vercel.app{src}'
    js = urllib.request.urlopen(url).read().decode('utf-8', errors='replace')
    
    # Search for key patterns that should be in the deployed App.tsx
    checks = {
        'BoxReveal rendered': re.search(r'BoxReveal|boxReveal|box-reveal', js, re.I),
        'HudBar rendered': re.search(r'HudBar|hudBar|hud-bar', js, re.I),
        'initAuth call': re.search(r'initAuth', js),
        'loadContent call': re.search(r'loadContent', js),
        'boxRewards in store': re.search(r'boxRewards', js),
        'clearBoxRewards': re.search(r'clearBoxRewards', js),
        'AppContent component': re.search(r'AppContent', js),
    }
    
    for name, found in checks.items():
        print(f'{name}: {"YES" if found else "NO"}')
    
    # Show context around the location where BoxReveal is rendered
    if m := re.search(r'(\w+)\([^)]*BoxReveal[^)]*\)', js):
        print(f'BoxReveal render call: {m.group(0)[:200]}')
