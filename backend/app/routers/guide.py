import random

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import get_content_loader, get_current_user_id, get_db
from app.services.content_loader import ContentLoader

router = APIRouter(prefix="/guide", tags=["guide"])


def _has_event(user_id: str, event_key: str, db: Client) -> bool:
    result = db.table("user_events").select("id").eq("user_id", user_id).eq("event_key", event_key).execute()
    return len(result.data) > 0


def _get_entry_progress(user_id: str, chapter_id: str, entry_id: str, db: Client) -> dict | None:
    result = (
        db.table("guide_progress")
        .select("*")
        .eq("user_id", user_id)
        .eq("chapter_id", chapter_id)
        .eq("entry_id", entry_id)
        .execute()
    )
    return result.data[0] if result.data else None


def _get_chapter_progress(user_id: str, chapter_id: str, db: Client) -> dict | None:
    result = (
        db.table("chapter_progress")
        .select("*")
        .eq("user_id", user_id)
        .eq("chapter_id", chapter_id)
        .execute()
    )
    return result.data[0] if result.data else None


@router.get("/chapters")
async def get_chapters(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    guide = content.guide
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")

    result = []
    for ch in guide.get("chapters", []):
        ch_progress = _get_chapter_progress(user_id, ch["id"], db)
        all_unlocked = True
        researched_count = 0
        total = len(ch["entries"])
        entries_summary = []

        for entry in ch["entries"]:
            prog = _get_entry_progress(user_id, ch["id"], entry["id"], db)
            status = "locked"
            if prog:
                status = prog["status"]
            if entry.get("unlock_event"):
                has = _has_event(user_id, entry["unlock_event"], db)
                if not has and status == "locked":
                    status = "hidden"
            if status == "researched":
                researched_count += 1
            if status != "researched" and status != "glitched" and not entry.get("unlock_event"):
                all_unlocked = False
            if entry.get("unlock_event") and status == "locked":
                has = _has_event(user_id, entry["unlock_event"], db)
                if not has:
                    all_unlocked = False

            entries_summary.append({
                "id": entry["id"],
                "title": entry["title"],
                "fragment_cost": entry.get("fragment_cost", 0),
                "status": status,
                "has_event": _has_event(user_id, entry["unlock_event"], db) if entry.get("unlock_event") else None,
                "unlock_event": entry.get("unlock_event"),
            })

        result.append({
            "id": ch["id"],
            "title": ch["title"],
            "description": ch["description"],
            "order": ch.get("order", 99),
            "is_secret": ch.get("is_secret", False),
            "reward_artifact_id": ch.get("reward_artifact_id"),
            "total_entries": total,
            "researched_count": researched_count,
            "all_researched": researched_count == total,
            "reward_claimed": ch_progress["reward_claimed"] if ch_progress else False,
            "entries": entries_summary,
        })

    result.sort(key=lambda x: x["order"])
    return {"chapters": result}


@router.get("/chapters/{chapter_id}")
async def get_chapter_detail(
    chapter_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    chapter = content.get_guide_chapter(chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    ch_progress = _get_chapter_progress(user_id, chapter_id, db)
    researched_count = 0
    entries_detail = []

    for entry in chapter.get("entries", []):
        prog = _get_entry_progress(user_id, chapter_id, entry["id"], db)
        status = "locked"
        if prog:
            status = prog["status"]
        if entry.get("unlock_event"):
            has = _has_event(user_id, entry["unlock_event"], db)
            if not has and status == "locked":
                status = "hidden"

        if status == "researched":
            researched_count += 1

        entry_data = {
            "id": entry["id"],
            "title": entry["title"],
            "text": entry["text"] if status in ("researched", "glitched") else None,
            "fragment_cost": entry.get("fragment_cost", 0),
            "status": status,
            "glitch_chance": entry.get("glitch_chance", 0),
            "unlock_event": entry.get("unlock_event"),
        }
        entries_detail.append(entry_data)

    return {
        "id": chapter["id"],
        "title": chapter["title"],
        "description": chapter["description"],
        "is_secret": chapter.get("is_secret", False),
        "reward_artifact_id": chapter.get("reward_artifact_id"),
        "total_entries": len(chapter["entries"]),
        "researched_count": researched_count,
        "all_researched": researched_count == len(chapter["entries"]),
        "reward_claimed": ch_progress["reward_claimed"] if ch_progress else False,
        "entries": entries_detail,
    }


class ResearchRequest(BaseModel):
    chapter_id: str
    entry_id: str


@router.post("/research")
async def research_entry(
    body: ResearchRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    entry = content.get_guide_entry(body.chapter_id, body.entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    if entry.get("unlock_event"):
        has = _has_event(user_id, entry["unlock_event"], db)
        if not has:
            raise HTTPException(status_code=400, detail="Unlock condition not met")

    prog = _get_entry_progress(user_id, body.chapter_id, body.entry_id, db)
    if prog and prog["status"] == "researched":
        raise HTTPException(status_code=400, detail="Entry already researched")
    if prog and prog["status"] == "glitched":
        raise HTTPException(status_code=400, detail="Entry is glitched, fix it first")

    cost = entry.get("fragment_cost", 0)

    user_result = db.table("users").select("balance_fragments").eq("id", user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    current_balance = user_result.data[0].get("balance_fragments", 0)
    if current_balance < cost:
        raise HTTPException(status_code=400, detail=f"Not enough fragments. Need {cost}, have {current_balance}")

    db.table("users").update({"balance_fragments": current_balance - cost}).eq("id", user_id).execute()

    glitch_chance = entry.get("glitch_chance", 0)
    is_glitched = glitch_chance > 0 and random.random() < glitch_chance
    new_status = "glitched" if is_glitched else "researched"

    if prog:
        db.table("guide_progress").update({"status": new_status}).eq("id", prog["id"]).execute()
    else:
        db.table("guide_progress").insert({
            "user_id": user_id,
            "chapter_id": body.chapter_id,
            "entry_id": body.entry_id,
            "status": new_status,
        }).execute()

    return {
        "status": new_status,
        "fixed": not is_glitched,
        "balance_fragments": current_balance - cost,
    }


@router.post("/fix-glitch")
async def fix_glitch(
    body: ResearchRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    entry = content.get_guide_entry(body.chapter_id, body.entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    prog = _get_entry_progress(user_id, body.chapter_id, body.entry_id, db)
    if not prog or prog["status"] != "glitched":
        raise HTTPException(status_code=400, detail="Entry is not glitched")

    cost = entry.get("fragment_cost", 0) * 2

    user_result = db.table("users").select("balance_fragments").eq("id", user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    current_balance = user_result.data[0].get("balance_fragments", 0)
    if current_balance < cost:
        raise HTTPException(status_code=400, detail=f"Not enough fragments. Need {cost}, have {current_balance}")

    db.table("users").update({"balance_fragments": current_balance - cost}).eq("id", user_id).execute()
    db.table("guide_progress").update({"status": "researched"}).eq("id", prog["id"]).execute()

    db.table("users").update({"glitches_fixed": db.raw("glitches_fixed + 1")}).eq("id", user_id).execute()

    result = db.table("users").select("glitches_fixed").eq("id", user_id).execute()
    current_glitches = result.data[0].get("glitches_fixed", 0) if result.data else 0
    db.table("users").update({"glitches_fixed": current_glitches + 1}).eq("id", user_id).execute()

    return {
        "status": "researched",
        "balance_fragments": current_balance - cost,
    }


class ClaimRewardRequest(BaseModel):
    chapter_id: str


@router.post("/claim-reward")
async def claim_reward(
    body: ClaimRewardRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    chapter = content.get_guide_chapter(body.chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    ch_progress = _get_chapter_progress(user_id, body.chapter_id, db)
    if ch_progress and ch_progress["reward_claimed"]:
        raise HTTPException(status_code=400, detail="Reward already claimed")

    all_progress = (
        db.table("guide_progress")
        .select("*")
        .eq("user_id", user_id)
        .eq("chapter_id", body.chapter_id)
        .execute()
    )
    researched = sum(1 for p in all_progress.data if p["status"] == "researched")
    if researched != len(chapter.get("entries", [])):
        raise HTTPException(status_code=400, detail="Not all entries researched")

    artifact_id = chapter.get("reward_artifact_id")
    if not artifact_id:
        raise HTTPException(status_code=404, detail="No reward artifact defined")

    artifact = content.get_artifact(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Reward artifact not found in content")

    existing = (
        db.table("user_inventory")
        .select("*")
        .eq("user_id", user_id)
        .eq("item_config_id", artifact_id)
        .execute()
    )
    if existing.data:
        db.table("user_inventory").update({
            "quantity": existing.data[0]["quantity"] + 1,
        }).eq("id", existing.data[0]["id"]).execute()
    else:
        db.table("user_inventory").insert({
            "user_id": user_id,
            "item_type": "artifact",
            "item_config_id": artifact_id,
            "quantity": 1,
            "metadata": {},
        }).execute()

    if ch_progress:
        db.table("chapter_progress").update({"reward_claimed": True}).eq("id", ch_progress["id"]).execute()
    else:
        db.table("chapter_progress").insert({
            "user_id": user_id,
            "chapter_id": body.chapter_id,
            "reward_claimed": True,
        }).execute()

    return {"status": "claimed", "artifact_id": artifact_id, "artifact_name": artifact.get("name_key", artifact_id)}
