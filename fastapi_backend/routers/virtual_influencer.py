"""
Virtual Influencer router
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import VirtualInfluencer
from utils.dependencies import get_current_user
from database import get_virtual_influencers_repository, get_mock_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/virtual-influencers", tags=["Virtual Influencer"])


def get_all_vis() -> List[dict]:
    """Helper to get all VIs from DB or Mock"""
    # Try Firebase
    repo = get_virtual_influencers_repository()
    if repo:
        vis = repo.find_all() # find_all should return the list as per database.py/firebase_config.py
        # Ensure we return a list
        return vis if vis else []
    
    # Fallback to Mock
    mock_db = get_mock_db()
    return mock_db.get_all_virtual_influencers()


@router.get("", response_model=List[VirtualInfluencer])
async def list_virtual_influencers(current_user: dict = Depends(get_current_user)):
    """
    Get list of available virtual influencers for rent.
    """
    influencers = get_all_vis()
    return [VirtualInfluencer(**inf) for inf in influencers]


@router.post("/create", response_model=VirtualInfluencer)
async def create_virtual_influencer(
    influencer: VirtualInfluencer,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new virtual influencer.
    """
    vi_data = influencer.dict()
    
    # Try Firebase
    repo = get_virtual_influencers_repository()
    if repo:
        result = repo.create(vi_data)
        if result:
            return VirtualInfluencer(**result)
            
    # Fallback/Mock
    mock_db = get_mock_db()
    saved = mock_db.create_virtual_influencer(vi_data)
    return VirtualInfluencer(**saved)


@router.get("/{influencer_id}")
async def get_virtual_influencer(
    influencer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get details of a specific virtual influencer.
    """
    # Try Firebase
    repo = get_virtual_influencers_repository()
    if repo:
        inf = repo.find_by_id(influencer_id)
        if inf:
            return VirtualInfluencer(**inf)
            
    # Fallback/Mock
    mock_db = get_mock_db()
    inf = mock_db.get_virtual_influencer_by_id(influencer_id)
    
    if inf:
        return VirtualInfluencer(**inf)
    
    raise HTTPException(status_code=404, detail="Virtual influencer not found")
