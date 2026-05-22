"""Simulate the user creation flow to find what breaks."""
import os
from pathlib import Path

env_path = Path(__file__).parent / '.env'
for line in env_path.read_text(encoding='utf-8').splitlines():
    line = line.strip()
    if line and '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        os.environ[k.strip()] = v.strip()

from supabase import create_client
from app.models.user import UserProfile

url = os.environ.get('SUPABASE_URL', '')
key = os.environ.get('SUPABASE_KEY', '')
client = create_client(url, key)

# Simulate what the fixed code does
from datetime import datetime, timezone
now = datetime.now(timezone.utc).isoformat()

new_user = {
    "id": "00000000-0000-0000-0000-000000000001",  # dummy UUID
    "username": "testuser",
    "language_code": "en",
    "balance_xgen": 0,
    "balance_stars": 0,
    "level": 1,
    "xp": 0,
    "streak_days": 0,
    "created_at": now,
    "last_login": now,
}

print('Inserting test user...')
result = client.table("users").insert(new_user).execute()
data = result.data
print(f'Insert result: {data}')

if data:
    print(f'Parsing ProfileResponse...')
    try:
        from app.routers.user import ProfileResponse
        pr = ProfileResponse(**data[0], is_new=True, box_rewards={"guaranteed":[],"random":[]})
        print(f'OK: {pr.model_dump()}')
    except Exception as e:
        print(f'ERROR parsing ProfileResponse: {e}')

# Clean up
client.table("users").delete().eq('id', '00000000-0000-0000-0000-000000000001').execute()
print('Cleanup done')
