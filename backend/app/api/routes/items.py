import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Item, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate, Message
from app.core.media import get_media_service, MediaService

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ItemsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Item)
        count = session.exec(count_statement).one()
        statement = select(Item).offset(skip).limit(limit)
        items = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Item)
            .where(Item.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Item)
            .where(Item.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()

    return ItemsPublic(data=items, count=count)


@router.get("/{id}", response_model=ItemPublic)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return item


@router.post("/", response_model=ItemPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    """
    Create new item.
    """
    item = Item.model_validate(item_in, update={"owner_id": current_user.id})
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.post("/upload-media", response_model=dict)
async def upload_media(
    file: UploadFile = File(...),
    media_service: MediaService = Depends(get_media_service),
) -> Any:
    """
    Upload media file (image or video) for items.
    """
    result = media_service.upload_file(file)
    return result


@router.post("/{id}/media", response_model=ItemPublic)
async def add_media_to_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    file: UploadFile = File(...),
    media_service: MediaService = Depends(get_media_service),
) -> Any:
    """
    Add media (image or video) to an existing item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Upload file
    upload_result = media_service.upload_file(file)
    
    # Update item with media information
    if upload_result["resource_type"] == "image":
        item.image_url = upload_result["url"]
        item.media_type = "image"
    elif upload_result["resource_type"] == "video":
        item.video_url = upload_result["url"]
        item.media_type = "video"
    
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.put("/{id}", response_model=ItemPublic)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    item_in: ItemUpdate,
) -> Any:
    """
    Update an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{id}")
def delete_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    media_service: MediaService = Depends(get_media_service),
) -> Any:
    """
    Delete an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Delete media files if they exist
    if item.image_url and "cloudinary" in item.image_url:
        # Extract public_id from URL (you might need to store this separately)
        pass
    if item.video_url and "cloudinary" in item.video_url:
        # Extract public_id from URL (you might need to store this separately)
        pass
    
    session.delete(item)
    session.commit()
    return {"message": "Item deleted successfully"}
