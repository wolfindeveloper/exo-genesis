from supabase import create_client

from app.core.config import settings

_supabase_client = None


async def get_supabase():
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )
    return _supabase_client
