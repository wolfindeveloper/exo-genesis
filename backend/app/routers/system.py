from fastapi import APIRouter, Depends
from supabase import Client

from app.core.dependencies import get_db
from app.models.lab import WeekInfo
from app.services.recipe_generator import get_weekly_recipes, week_seed
from app.services.content_loader import ContentLoader
from app.core.dependencies import get_content_loader

router = APIRouter(tags=["system"])


@router.get("/system/week-info", response_model=WeekInfo)
async def week_info(
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    week = week_seed()
    recipes = get_weekly_recipes(content)
    discoveries = (
        db.table("discoveries")
        .select("*", count="exact")
        .eq("week_seed", week)
        .execute()
    )
    return WeekInfo(
        week_seed=week,
        total_recipes=len(recipes),
        discoveries_this_week=len(discoveries.data or []),
    )
