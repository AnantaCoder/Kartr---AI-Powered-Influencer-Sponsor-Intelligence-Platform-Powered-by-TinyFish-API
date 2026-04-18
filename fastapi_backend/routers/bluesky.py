import logging
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from typing import Optional
import os
from datetime import datetime
from models.social_schemas import BlueskyConnectRequest, BlueskyPostRequest, BlueskyPostResponse
from services.bluesky_service import bluesky_service
from services.video_service import VIDEOS_DIR
from services.auth_service import AuthService
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/bluesky",
    tags=["Bluesky"]
)

@router.get("/search-creators", response_model=dict)
async def search_global_bluesky_creators(
    q: str = Query(..., description="Search query/niche term"),
    limit: int = Query(10, ge=1, le=25, description="Number of results"),
):
    """
    Search real Bluesky accounts globally by keyword/niche.
    Uses TinyFish to do an authenticated Bluesky search, fetching the top
    matching creators. Falls back to the public AT Protocol search API.
    """
    import httpx
    import os

    # --- Strategy 1: TinyFish-powered authenticated search ---
    tinyfish_key = os.getenv("TINYFISH_API_KEY", "").strip()
    bsky_handle = os.getenv("BLUESKY_HANDLE", "")
    bsky_password = os.getenv("BLUESKY_PASSWORD", "")

    if tinyfish_key and tinyfish_key != "sk-tinyfish-":
        try:
            prompt = (
                f'Go to https://bsky.app and log in with username "{bsky_handle}" and password "{bsky_password}". '
                f'Use the search bar to search for "{q}". '
                f'Filter to "People" tab. '
                f'Return a structured list of the top {limit} matching profiles, each with: '
                f'handle (the @handle), displayName, followersCount, and description/bio if visible. '
                f'Return as JSON array with fields: bluesky_handle, display_name, followers_count, description.'
            )
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    "https://api.tinyfish.ai/v1/run",
                    headers={"Authorization": f"Bearer {tinyfish_key}"},
                    json={"prompt": prompt, "output": "json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    creators = data if isinstance(data, list) else data.get("result", [])
                    if creators and len(creators) > 0:
                        return {"creators": creators, "query": q, "count": len(creators), "source": "tinyfish"}
        except Exception as e:
            logger.warning(f"TinyFish Bluesky search failed: {e}. Falling back.")

    # --- Strategy 2: Bluesky authenticated search via atproto ---
    try:
        from atproto import Client
        import asyncio

        loop = asyncio.get_running_loop()

        def _clean_search_terms(raw_query: str) -> list[str]:
            """
            Extract clean, individual search terms from a potentially
            comma-separated or multi-word campaign keywords string.
            Returns a prioritized list of terms to try.
            """
            # Skip very short / noise words
            STOP_WORDS = {"the", "a", "an", "and", "or", "in", "of", "for",
                          "to", "with", "is", "are", "be", "by", "on", "at",
                          "csc", "etc", "vs", "via"}
            # Split by commas and whitespace
            parts = [p.strip() for p in raw_query.replace(',', ' ').split()]
            # Filter: keep words longer than 2 chars that aren't stop words
            meaningful = [p for p in parts if len(p) > 2 and p.lower() not in STOP_WORDS]
            # Deduplicate while preserving order
            seen, unique = set(), []
            for p in meaningful:
                pl = p.lower()
                if pl not in seen:
                    seen.add(pl)
                    unique.append(p)
            # If nothing, fall back to first raw part
            return unique if unique else [raw_query.split(',')[0].strip()]

        def _search_authenticated():
            client = Client()
            client.login(bsky_handle, bsky_password)

            search_terms = _clean_search_terms(q)
            logger.info(f"Bluesky search terms to try: {search_terms}")

            actors = []
            for term in search_terms:
                result = client.app.bsky.actor.search_actors(
                    {"q": term, "limit": limit}
                )
                actors = result.actors or []
                if actors:
                    logger.info(f"Got {len(actors)} results for term '{term}'")
                    break
                logger.debug(f"No results for '{term}', trying next term...")

            if not actors:
                return []
            # Batch fetch profiles to get follower counts
            dids = [a.did for a in actors]
            profiles_resp = client.app.bsky.actor.get_profiles({"actors": dids})
            profile_map = {p.did: p for p in (profiles_resp.profiles or [])}
            return [
                {
                    "bluesky_handle": a.handle,
                    "display_name": a.display_name or a.handle,
                    "description": (profile_map.get(a.did, a).description or "")[:120],
                    "followers_count": getattr(profile_map.get(a.did), 'followers_count', 0) or 0,
                    "avatar": a.avatar or "",
                    "did": a.did,
                }
                for a in actors
            ]

        creators = await loop.run_in_executor(None, _search_authenticated)
        if creators:
            return {"creators": creators, "query": q, "count": len(creators), "source": "bluesky_auth"}
    except Exception as e:
        logger.warning(f"Authenticated atproto search failed: {e}. Falling back to public API.")


    # --- Strategy 3: Public AT Protocol API (no auth needed) ---
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors",
                params={"q": q, "limit": limit}
            )
            if resp.status_code == 200:
                actors = resp.json().get("actors", [])
                results = [
                    {
                        "bluesky_handle": a.get("handle", ""),
                        "display_name": a.get("displayName") or a.get("handle", ""),
                        "description": (a.get("description") or "")[:120],
                        "followers_count": 0,
                        "avatar": a.get("avatar", ""),
                        "did": a.get("did", ""),
                    }
                    for a in actors
                ]
                return {"creators": results, "query": q, "count": len(results), "source": "public_api"}
    except Exception as e:
        logger.error(f"All Bluesky search strategies failed: {e}")

    raise HTTPException(status_code=503, detail="Could not fetch Bluesky creators. Please try again later.")


@router.get("/lookup-profile", response_model=dict)
async def lookup_bluesky_profile(
    handle: str = Query(..., description="Bluesky handle (with or without @)"),
):
    """
    Fetch a single Bluesky profile by handle.
    Used by the Custom tab to add specific users to the outreach list.
    """
    clean_handle = handle.lstrip("@").strip()
    if not clean_handle:
        raise HTTPException(status_code=400, detail="Handle cannot be empty")
    # Add .bsky.social if no domain specified
    if "." not in clean_handle:
        clean_handle = f"{clean_handle}.bsky.social"

    bsky_handle = os.getenv("BLUESKY_HANDLE", "")
    bsky_password = os.getenv("BLUESKY_PASSWORD", "")

    # Strategy 1: authenticated lookup (gets followers count)
    if bsky_handle and bsky_password:
        try:
            from atproto import Client
            import asyncio

            def _lookup():
                c = Client()
                c.login(bsky_handle, bsky_password)
                p = c.app.bsky.actor.get_profile({"actor": clean_handle})
                return {
                    "bluesky_handle": p.handle,
                    "display_name": p.display_name or p.handle,
                    "description": (p.description or "")[:160],
                    "followers_count": getattr(p, "followers_count", 0) or 0,
                    "avatar": p.avatar or "",
                    "did": p.did,
                    "found": True,
                }

            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, _lookup)
            return result
        except Exception as e:
            err = str(e)
            if "Profile not found" in err or "InvalidRequest" in err:
                raise HTTPException(status_code=404, detail=f"@{clean_handle} not found on Bluesky.")
            logger.warning(f"Authenticated profile lookup failed: {e}")

    # Strategy 2: public API fallback
    import httpx
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile",
                params={"actor": clean_handle}
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail=f"@{clean_handle} not found on Bluesky.")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Bluesky lookup failed.")
            d = resp.json()
            return {
                "bluesky_handle": d.get("handle", clean_handle),
                "display_name": d.get("displayName") or d.get("handle", clean_handle),
                "description": (d.get("description") or "")[:160],
                "followers_count": d.get("followersCount", 0) or 0,
                "avatar": d.get("avatar", ""),
                "did": d.get("did", ""),
                "found": True,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not resolve profile: {e}")


@router.post("/connect", response_model=dict)
async def connect_bluesky_account(
    request: BlueskyConnectRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Link a Bluesky account to the current user.
    Verifies credentials before saving.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Get user ID (might be under 'id' or 'uid')
    user_id = current_user.get("id") or current_user.get("uid")
    logger.info(f"Connecting Bluesky for user: {user_id}")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found in session")
    
    # 1. Verify credentials with Bluesky
    is_valid = bluesky_service.verify_credentials(request.identifier, request.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Bluesky credentials. Please check your handle and app password.")
    
    # 2. Save to User Profile (Database)
    update_data = {
        "bluesky_handle": request.identifier,
        "bluesky_password": request.password  # In production, encrypt this!
    }
    
    updated_user = AuthService.update_user(user_id, update_data)
    
    if not updated_user:
        logger.error(f"Failed to update user {user_id} with Bluesky credentials")
        raise HTTPException(status_code=500, detail="Failed to save Bluesky credentials to profile")
        
    logger.info(f"Bluesky account {request.identifier} linked to user {user_id}")
    return {"success": True, "message": f"Bluesky account {request.identifier} linked successfully"}


@router.get("/status", response_model=dict)
async def get_bluesky_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's Bluesky connection status.
    Returns handle if connected, or null if not.
    """
    # current_user already contains full user data from get_current_user
    handle = current_user.get("bluesky_handle")
    
    return {
        "connected": bool(handle),
        "handle": handle if handle else None,
    }


@router.post("/post", response_model=BlueskyPostResponse)
async def create_post(
    text: str = Form(...),
    image_path: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    video_path: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a post on Bluesky.
    Uses linked account credentials.
    
    Can accept:
    - Text only
    - Text with image file (upload)
    - Text with image path (existing file)
    - Text with video path
    - Text with video file (upload)
    """
    try:
        user_full = AuthService.get_user_by_id(current_user["id"])
        if not user_full:
            raise HTTPException(status_code=404, detail="User not found")

        handle = user_full.get("bluesky_handle")
        password = user_full.get("bluesky_password")
        
        if not handle or not password:
            raise HTTPException(
                status_code=400, 
                detail="Bluesky account not linked. Please connect your account first via /bluesky/connect"
            )

        # Handle image upload if provided
        final_image_path = image_path
        if image_file:
            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}_{image_file.filename}"
            final_image_path = os.path.join(uploads_dir, filename)
            
            content = await image_file.read()
            with open(final_image_path, "wb") as f:
                f.write(content)

        # Handle video path - either direct path or filename in VIDEOS_DIR
        final_video_path = video_path
        
        # Handle video upload if provided (overrides path)
        if video_file:
            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"video_{timestamp}_{video_file.filename}"
            final_video_path = os.path.join(uploads_dir, filename)
            
            content = await video_file.read()
            with open(final_video_path, "wb") as f:
                f.write(content)

        # If video_path is just a filename (from frontend), resolve it to VIDEOS_DIR
        if final_video_path and not video_file and not os.path.isabs(final_video_path) and not os.path.exists(final_video_path):
            potential_path = os.path.join(VIDEOS_DIR, final_video_path)
            if os.path.exists(potential_path):
                final_video_path = potential_path

        # Post based on content type
        if final_video_path:
            result = await bluesky_service.post_video(
                identifier=handle,
                password=password,
                text=text, 
                video_path=final_video_path,
                alt_text=alt_text or "Video"
            )
            
            # Clean up uploaded video file
            if video_file:
                try:
                    os.remove(final_video_path)
                except:
                    pass
                    
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        elif final_image_path:
            result = bluesky_service.post_image(
                identifier=handle,
                password=password,
                text=text, 
                image_path=final_image_path,
                alt_text=alt_text or ""
            )
            # Clean up uploaded file
            if image_file:
                try:
                    os.remove(final_image_path)
                except:
                    pass
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        elif video_url:
            result = await bluesky_service.post_video_url(
                identifier=handle,
                password=password,
                text=text,
                video_url=video_url,
                alt_text=alt_text or "Video"
            )
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        elif image_url:
            result = await bluesky_service.post_image_url(
                identifier=handle,
                password=password,
                text=text,
                image_url=image_url,
                alt_text=alt_text or ""
            )
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        else:
            result = bluesky_service.post_text(
                identifier=handle,
                password=password,
                text=text
            )
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post: {str(e)}")
