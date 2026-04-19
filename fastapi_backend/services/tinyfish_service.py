import os
import logging
import asyncio
import json
from typing import Optional

logger = logging.getLogger(__name__)

TINYFISH_API_KEY = os.getenv("TINYFISH_API_KEY", "")
BLUESKY_HANDLE = os.getenv("BLUESKY_HANDLE")
BLUESKY_PASSWORD = os.getenv("BLUESKY_PASSWORD")


class TinyFishService:
    """
    Service to send Bluesky DMs for campaign outreach.
    
    Primary: Uses real Bluesky DM API via atproto (requires valid credentials).
    Fallback: TinyFish browser-bot automation (if API key configured).
    """

    BASE_URL = "https://api.agentql.com/v1"

    @staticmethod
    def _build_message(custom_message: Optional[str], invite_link: str) -> str:
        """Build the final outreach message, replacing [LINK] placeholder."""
        if custom_message:
            if "[LINK]" in custom_message:
                return custom_message.replace("[LINK]", invite_link)
            return f"{custom_message}\n\nJoin here: {invite_link}"
        return (
            f"Hi! I'd love to invite you to an exciting sponsorship campaign on Kartr.\n"
            f"Join here: {invite_link}"
        )

    @staticmethod
    async def _send_bluesky_dm(target_handle: str, message: str) -> tuple[bool, str | None]:
        """
        Send a real Bluesky DM to the target handle using the atproto chat API.
        Returns (success, error_reason).
        """
        if not BLUESKY_HANDLE or not BLUESKY_PASSWORD:
            logger.error("Bluesky credentials not configured (BLUESKY_HANDLE / BLUESKY_PASSWORD missing).")
            return False, "Bluesky credentials not configured"

        try:
            from atproto import Client, models

            loop = asyncio.get_running_loop()

            def _do_dm():
                client = Client()
                client.login(BLUESKY_HANDLE, BLUESKY_PASSWORD)

                # Resolve target handle to DID
                clean_handle = target_handle.lstrip("@")
                profile = client.app.bsky.actor.get_profile({"actor": clean_handle})
                target_did = profile.did
                logger.info(f"Resolved {clean_handle} -> DID {target_did}")

                # Use the Bluesky Chat proxy to access DM endpoints
                chat_client = client.with_bsky_chat_proxy()

                # Get or create a DM conversation (must include both participants)
                convo_resp = chat_client.chat.bsky.convo.get_convo_for_members(
                    {"members": [client.me.did, target_did]}
                )
                convo_id = convo_resp.convo.id
                logger.info(f"Conversation ID for {clean_handle}: {convo_id}")

                # Send the message
                chat_client.chat.bsky.convo.send_message(
                    {
                        "convo_id": convo_id,
                        "message": {"text": message}
                    }
                )
                logger.info(f"✅ DM sent to {clean_handle} via Bluesky Chat API")
                return True, None

            result = await loop.run_in_executor(None, _do_dm)
            return result

        except Exception as e:
            err_str = str(e)
            # Known Bluesky DM restriction errors
            if "MessagesDisabled" in err_str:
                logger.warning(f"[DM Blocked] {target_handle} has disabled incoming messages.")
                return False, f"{target_handle} has disabled incoming Bluesky DMs."
            if "NotFollowedBySender" in err_str:
                logger.warning(f"[DM Blocked] {target_handle} only accepts DMs from people they follow.")
                return False, f"{target_handle} only accepts DMs from accounts they follow."
            logger.error(f"Failed to send Bluesky DM to {target_handle}: {e}")
            return False, str(e)

    @staticmethod
    async def _fallback_tinyfish(target_handle: str, invite_link: str, message: str) -> bool:
        """Fallback to TinyFish browser automation if configured."""
        import httpx

        api_key = TINYFISH_API_KEY.strip()
        if not api_key or api_key == "sk-tinyfish-":
            logger.warning(
                f"[DEMO MODE] TinyFish key also missing. "
                f"Would send to {target_handle}: '{message[:80]}...'"
            )
            return True  # Simulate success for demo

        prompt = (
            f'Log into Bluesky with username "{BLUESKY_HANDLE}" and password "{BLUESKY_PASSWORD}". '
            f'Navigate to the profile at https://bsky.app/profile/{target_handle.lstrip("@")}. '
            f"Open their DMs and send this exact message: '{message}'"
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{TinyFishService.BASE_URL}/run",
                    headers={"X-API-Key": api_key},
                    json={"prompt": prompt},
                )
                if response.status_code == 200:
                    logger.info(f"TinyFish bot scheduled for {target_handle}")
                    return True
                logger.error(f"TinyFish API error {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.error(f"TinyFish request failed: {e}")
            return False

    @staticmethod
    async def _run_tinyfish_prompt(prompt: str) -> Optional[str]:
        """Run a generic prompt via TinyFish and return the text result."""
        import httpx
        
        api_key = TINYFISH_API_KEY.strip()
        if not api_key or api_key == "sk-tinyfish-":
            logger.warning("[DEMO MODE] TinyFish key missing. Cannot run prompt.")
            return None

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{TinyFishService.BASE_URL}/run",
                    headers={"X-API-Key": api_key},
                    json={"prompt": prompt},
                )
                if response.status_code == 200:
                    data = response.json()
                    # TinyFish response usually contains 'output' or 'result'
                    return data.get("output") or data.get("result") or str(data)
                
                logger.error(f"TinyFish API error {response.status_code}: {response.text}")
                return None
        except Exception as e:
            logger.error(f"TinyFish request failed: {e}")
            return None

    @staticmethod
    async def scrape_youtube_comments(video_url: str, max_comments: int = 50) -> list[dict]:
        """
        Scrape comments from a YouTube video using the TinyFish Agent API (AgentQL).
        Returns a list of dictionaries with 'text', 'author', and 'likes'.
        """
        import httpx

        api_key = TINYFISH_API_KEY.strip()
        if not api_key or api_key == "sk-tinyfish-":
            logger.warning("[DEMO MODE] TinyFish key missing. Cannot scrape comments.")
            return []

        logger.info(f"Scraping YouTube comments for: {video_url} using Agent API")
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                query = "{ comments[] { username text likes } }"
                goal = f"Extract the top {max_comments} comments, including the username, comment text, and number of likes, and return them as JSON."
                
                # Using /query-data endpoint as per AgentQL docs
                response = await client.post(
                    f"{TinyFishService.BASE_URL}/query-data",
                    headers={
                        "X-API-Key": api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "url": video_url,
                        "query": query,
                        "params": {
                            "is_scroll_to_bottom_enabled": True,
                            "wait_for": 3
                        }
                    },
                    timeout=120.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # The structured output can be inside 'data', directly in the object, or inside 'output'
                    result_data = data.get("data", data)
                    
                    if isinstance(result_data, dict) and "comments" in result_data:
                        raw_comments = result_data["comments"]
                    elif isinstance(result_data, list):
                        raw_comments = result_data
                    else:
                        output_str = data.get("output", "")
                        try:
                            # Try parsing stringified JSON
                            import json
                            parsed = json.loads(output_str) if isinstance(output_str, str) else output_str
                            if isinstance(parsed, dict) and "comments" in parsed:
                                raw_comments = parsed["comments"]
                            elif isinstance(parsed, list):
                                raw_comments = parsed
                            else:
                                raw_comments = []
                        except Exception:
                            raw_comments = []

                    if not isinstance(raw_comments, list):
                        logger.error(f"Unexpected response format from TinyFish Agent: {data}")
                        return []

                    # Map 'username' back to 'author' to maintain compatibility with the rest of the application
                    mapped_comments = []
                    for c in raw_comments:
                        mapped_comments.append({
                            "author": c.get("username", c.get("author", "Unknown")),
                            "text": c.get("text", ""),
                            "likes": c.get("likes", 0)
                        })

                    logger.info(f"Successfully scraped {len(mapped_comments)} comments via TinyFish Agent")
                    return mapped_comments
                
                logger.error(f"TinyFish API error {response.status_code}: {response.text}")
                return []
        except Exception as e:
            logger.error(f"TinyFish request failed: {e}")
            return []

    @staticmethod
    async def invite_bluesky_influencer(
        target_handle: str,
        invite_link: str,
        custom_message: Optional[str] = None
    ) -> bool:
        """
        Send a campaign invite DM to a Bluesky user.

        Strategy:
          1. Try real Bluesky DM API via atproto (instant, reliable).
          2. Fall back to TinyFish browser automation.
        """
        message = TinyFishService._build_message(custom_message, invite_link)

        logger.info(f"Sending invite DM to {target_handle}")

        # --- Primary: Real Bluesky DM ---
        success, reason = await TinyFishService._send_bluesky_dm(target_handle, message)
        if success:
            return True

        # If the user has messages disabled, don't fall back to TinyFish bot - it can't bypass that either
        if reason and "disabled" in reason.lower():
            logger.warning(f"Skipping TinyFish fallback for {target_handle}: {reason}")
            return False

        # --- Fallback: TinyFish bot ---
        logger.warning(f"Bluesky DM failed for {target_handle} ({reason}). Trying TinyFish fallback...")
        return await TinyFishService._fallback_tinyfish(target_handle, invite_link, message)
