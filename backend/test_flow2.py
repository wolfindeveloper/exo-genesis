"""Full simulation of user creation + box opening."""
import os, sys
from pathlib import Path

sys.path.insert(0, Path(__file__).parent)

env_path = Path(__file__).parent / '.env'
for line in env_path.read_text(encoding='utf-8').splitlines():
    line = line.strip()
    if line and '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        os.environ[k.strip()] = v.strip()

from supabase import create_client
from datetime import datetime, timezone

url = os.environ.get('SUPABASE_URL', '')
key = os.environ.get('SUPABASE_KEY', '')
client = create_client(url, key)

# Step 1: Check what the actual column type is
print('=== Checking actual schema ===')
import httpx
r = httpx.get(
    f'{url}/rest/v1/users?select=id&limit=1',
    headers={'apikey': key, 'Authorization': f'Bearer {key}'},
)
print(f'Users endpoint response: HTTP {r.status_code}')

# Step 2: Try inserting with a Telegram-like ID (numeric string)
test_id = '999999999'
print(f'\n=== Trying to insert user with Telegram ID: {test_id} ===')
now = datetime.now(timezone.utc).isoformat()
new_user = {
    "id": test_id,
    "username": "test_telegram_user",
    "language_code": "en",
    "balance_xgen": 0,
    "balance_stars": 0,
    "level": 1,
    "xp": 0,
    "streak_days": 0,
    "created_at": now,
    "last_login": now,
}
try:
    result = client.table("users").insert(new_user).execute()
    print(f'Insert success: {result.data}')
except Exception as e:
    print(f'Insert FAILED: {e}')
    # Try with proper UUID format
    print('\nTrying with UUID format instead...')
    import uuid
    test_uuid = str(uuid.uuid4())
    new_user["id"] = test_uuid
    try:
        result = client.table("users").insert(new_user).execute()
        print(f'UUID insert success: {result.data}')
        # Clean up
        client.table("users").delete().eq('id', test_uuid).execute()
        print('Cleaned up test UUID user')
    except Exception as e2:
        print(f'UUID insert also FAILED: {e2}')
        print('Schema issue - column might not exist or have constraints')

# Clean up test user if created with Telegram ID
try:
    client.table("users").delete().eq('id', test_id).execute()
except:
    pass
