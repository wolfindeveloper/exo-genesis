from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_content_loader
from app.services.content_loader import ContentLoader

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/ships")
async def get_ships(content: ContentLoader = Depends(get_content_loader)):
    return content.ships


@router.get("/ships/{ship_id}")
async def get_ship(ship_id: str, content: ContentLoader = Depends(get_content_loader)):
    ship = content.get_ship(ship_id)
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    return ship


@router.get("/zones")
async def get_zones(content: ContentLoader = Depends(get_content_loader)):
    return content.zones


@router.get("/zones/{zone_id}")
async def get_zone(zone_id: str, content: ContentLoader = Depends(get_content_loader)):
    zone = content.get_zone(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.get("/elements")
async def get_elements(content: ContentLoader = Depends(get_content_loader)):
    return content.elements


@router.get("/elements/{element_id}")
async def get_element(element_id: str, content: ContentLoader = Depends(get_content_loader)):
    element = content.get_element(element_id)
    if not element:
        raise HTTPException(status_code=404, detail="Element not found")
    return element


@router.get("/resources")
async def get_resources(content: ContentLoader = Depends(get_content_loader)):
    return content.resources


@router.get("/resources/{resource_id}")
async def get_resource(resource_id: str, content: ContentLoader = Depends(get_content_loader)):
    resource = content.get_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.get("/artifacts")
async def get_artifacts(content: ContentLoader = Depends(get_content_loader)):
    return content.artifacts


@router.get("/boxes")
async def get_boxes(content: ContentLoader = Depends(get_content_loader)):
    return content.boxes


@router.get("/boxes/{box_id}")
async def get_box(box_id: str, content: ContentLoader = Depends(get_content_loader)):
    box = content.get_box(box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    return box
