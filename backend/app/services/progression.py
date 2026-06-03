from datetime import date, datetime, timezone

from supabase import Client


def check_streak(user_id: str, db: Client) -> dict:
    result = db.table("users").select("streak_days, last_login, level").eq("id", user_id).execute()
    if not result.data:
        return {"streak_days": 0, "streak_broken": False, "daily_reward": False}

    row = result.data[0]
    last = row.get("last_login")
    current_streak = row.get("streak_days", 0)
    today = date.today()

    if last:
        last_date = datetime.fromisoformat(last).date() if isinstance(last, str) else last
    else:
        last_date = today

    if last_date == today:
        return {"streak_days": current_streak, "streak_broken": False, "daily_reward": False}

    days_diff = (today - last_date).days
    if days_diff == 1:
        new_streak = current_streak + 1
        daily_reward = True
        streak_broken = False
    elif days_diff > 1:
        new_streak = 1
        daily_reward = True
        streak_broken = True
    else:
        return {"streak_days": current_streak, "streak_broken": False, "daily_reward": False}

    db.table("users").update({"streak_days": new_streak}).eq("id", user_id).execute()

    reward = None
    if daily_reward:
        fragment_bonus = min(new_streak, 30)
        cur = db.table("users").select("balance_fragments").eq("id", user_id).execute().data
        new_frags = (cur[0]["balance_fragments"] if cur else 0) + fragment_bonus
        db.table("users").update({"balance_fragments": new_frags}).eq("id", user_id).execute()
        reward = {"fragments": fragment_bonus}

    return {
        "streak_days": new_streak,
        "streak_broken": streak_broken,
        "daily_reward": daily_reward,
        "daily_reward_items": reward,
    }


def grant_xp(user_id: str, amount: int, db: Client) -> dict:
    result = db.table("users").select("xp, level").eq("id", user_id).execute()
    if not result.data:
        return {"xp": 0, "level": 1, "leveled_up": False}

    row = result.data[0]
    new_xp = row["xp"] + amount
    level = row["level"]
    leveled_up = False

    while new_xp >= level * 100:
        new_xp -= level * 100
        level += 1
        leveled_up = True

    db.table("users").update({"xp": new_xp, "level": level}).eq("id", user_id).execute()
    return {"xp": new_xp, "level": level, "leveled_up": leveled_up}
