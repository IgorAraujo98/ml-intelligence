from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import openai_svc

router = APIRouter()


class ProductInfo(BaseModel):
    name: str
    description: str
    category: Optional[str] = None


class ListingRequest(BaseModel):
    product_info: ProductInfo
    market_data: dict


class ImageRequest(BaseModel):
    briefing: str


@router.post("/generate")
async def generate_listing(req: ListingRequest):
    try:
        listing = await openai_svc.generate_listing(
            req.product_info.model_dump(),
            req.market_data,
        )
        return listing
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-image")
async def generate_image(req: ImageRequest):
    try:
        url = await openai_svc.generate_image(req.briefing)
        return {"image_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
