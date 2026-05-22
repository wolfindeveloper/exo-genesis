"""Deep check of initAuth call chain in deployed frontend."""
import re, urllib.request

html = urllib.request.urlopen('https://exo-genesis.vercel.app/').read().decode()
for src in re.findall(r'src="([^"]+\.js)"', html):
    url = f'https://exo-genesis.vercel.app{src}'
    js = urllib.request.urlopen(url).read().decode('utf-8', errors='replace')
    
    # Find the useEffect that calls initAuth
    # Look for patterns that show initAuth is called in useEffect
    patterns = [
        (r'initAuth\(\)', 'initAuth() called'),
        (r'loadContent\(\)', 'loadContent() called'),
        (r'async\(\)=>\{.*?initAuth', 'async wrapper calling initAuth'),
        (r'useEffect\(\(\)=>\{.*?initAuth', 'useEffect calling initAuth'),
    ]
    for pat, desc in patterns:
        if re.search(pat, js[:500000]):  # only search first 500k chars
            print(f'YES: {desc}')
    
    # Find the actual initAuth call context
    idx = js.find('initAuth')
    if idx >= 0:
        context = js[max(0,idx-200):idx+300]
        # Clean up for display
        print(f'\ninitAuth context ({idx}):')
        print(context)
        print()
