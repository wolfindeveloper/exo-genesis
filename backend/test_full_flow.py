"""End-to-end test of user creation + box opening logic."""
import sys, os
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
from app.services.box_opener import open_box
from app.services.content_loader import ContentLoader
from app.models.user import UserProfile

url = os.environ.get('SUPABASE_URL', '')
key = os.environ.get('SUPABASE_KEY', '')
db = create_client(url, key)

# Simulate a Telegram user
test_user_id = '999888777'
tg_user = {
    "id": test_user_id,
    "username": "testplayer",
    "language_code": "en",
}

# Step 1: Create user (like user.py does)
now = datetime.now(timezone.utc).isoformat()
new_user = {
    "id": test_user_id,
    "username": tg_user.get("username", ""),
    "language_code": tg_user.get("language_code", "en"),
    "balance_xgen": 0,
    "balance_stars": 0,
    "level": 1,
    "xp": 0,
    "streak_days": 0,
    "created_at": now,
    "last_login": now,
}
print('Step 1: Creating user...')
result = db.table("users").insert(new_user).execute()
if not result.data:
    print('FAIL: user insert returned no data')
    sys.exit(1)
print(f'  User created: {result.data[0]["id"]}')

# Step 2: Load content
content = ContentLoader()
content.load_all()
print('Step 2: Content loaded')

# Step 3: Open box
print('Step 3: Opening starter box...')
try:
    rewards = open_box("nothing_extra_starter_pack", test_user_id, db, content)
    print(f'  Box opened: guaranteed={len(rewards["guaranteed"])} items, random={len(rewards["random"])} items')
    print(f'  Rewards: {rewards}')
except Exception as e:
    print(f'FAIL: open_box error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Verify DB entries
print('\nStep 4: Verifying DB entries...')
user = db.table("users").select("*").eq("id", test_user_id).execute()
print(f'  User: balance_xgen={user.data[0]["balance_xgen"]}, xp={user.data[0]["xp"]}')

ships = db.table("user_ships").select("*").eq("user_id", test_user_id).execute()
print(f'  Ships: {len(ships.data)}')

inv = db.table("user_inventory").select("*").eq("user_id", test_user_id).execute()
print(f'  Inventory items: {len(inv.data)}')
for item in inv.data:
    print(f'    {item["item_type"]}: {item["item_config_id"]} x{item["quantity"]}')

# Step 5: Build ProfileResponse
print('\nStep 5: Building ProfileResponse...')
try:
    from app.routers.user import ProfileResponse
    pr = ProfileResponse(**user.data[0], is_new=True, box_rewards=rewards)
    dumped = pr.model_dump()
    print(f'  ProfileResponse OK: is_new={dumped["is_new"]}, box_rewards={"present" if dumped["box_rewards"] else "None"}')
    if dumped["box_rewards"]:
        print(f'  box_rewards keys: {list(dumped["box_rewards"].keys())}')
except Exception as e:
    print(f'FAIL: ProfileResponse error: {e}')
    import traceback
    traceback.print_exc()

# Clean up
print('\nStep 6: Cleaning up...')
db.table("user_inventory").delete().eq("user_id", test_user_id).execute()
db.table("user_ships").delete().eq("user_id", test_user_id).execute()
db.table("users").delete().eq("id", test_user_id).execute()
print('  Cleanup done')

print('\n=== ALL STEPS PASSED ===')
