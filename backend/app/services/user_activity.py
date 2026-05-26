from datetime import datetime, timedelta, timezone

_last_seen: dict[str, datetime] = {}

_ACTIVITY_TTL = timedelta(minutes=5)


def mark_active(user_id: str) -> None:
    _last_seen[user_id] = datetime.now(timezone.utc)


def is_recently_active(user_id: str) -> bool:
    ts = _last_seen.get(user_id)
    if ts is None:
        return False
    return datetime.now(timezone.utc) - ts < _ACTIVITY_TTL
