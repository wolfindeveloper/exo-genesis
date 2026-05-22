"""Check what API URL the deployed frontend is using."""
import re, urllib.request

html = urllib.request.urlopen('https://exo-genesis.vercel.app/').read().decode()
for src in re.findall(r'src="([^"]+\.js)"', html):
    url = f'https://exo-genesis.vercel.app{src}'
    js = urllib.request.urlopen(url).read().decode('utf-8', errors='replace')
    
    # Find API URL patterns
    for pattern in ['VITE_API_URL', 'api_url', 'BASE_URL', '127.0.0.1', 'hostingguru', 'exo-genesis-1ac1']:
        if pattern in js:
            idx = js.index(pattern)
            print(f'Found "{pattern}" in bundle:')
            print(f'  ...{js[max(0,idx-50):idx+150]}...')
            print()
