# Goal Description

The goal is to integrate the **TinyFish API** (an agentic web automation service) into Kartr specifically for inviting **Bluesky** influencers to join sponsor campaigns. 

When a sponsor initializes a campaign and matches with Bluesky influencers, they will trigger a TinyFish bot. The bot will automatically navigate to the influencer's Bluesky profile, initiate a Direct Message, and send a personalized invite containing a link to join the campaign on the Kartr platform.

## User Review Required

> [!IMPORTANT]  
> 1. **TinyFish API Key**: Do you have a Tinyfish API key ready to use, or should we create a mock integration for now to test the UI flow?
> 2. **Bluesky DM Requirements**: Tinyfish will need a Kartr "Sender" account to log into Bluesky to send the DMs. Do you have a dedicated Kartr Bluesky account ready for credential injection?

## Proposed Changes

---

### Backend (FastAPI)

#### [NEW] `fastapi_backend/services/tinyfish_service.py`
- Create a service to hit the TinyFish API (`api.tinyfish.ai/v1/run`).
- Add `invite_bluesky_influencer(bluesky_handle: str, invite_link: str)` that formats a prompt instructing the bot to log into Bluesky, navigate to `https://bsky.app/profile/{bluesky_handle}`, open the chat, and send the invite link.

#### [MODIFY] `fastapi_backend/routers/campaign.py`
- Add a POST endpoint: `/api/campaigns/{campaign_id}/send-bluesky-invites`.
- This endpoint will accept a list of `{ influencer_id, bluesky_handle }`.

#### [MODIFY] `fastapi_backend/services/campaign_service.py`
- Add logic to generate unique invite URLs for Bluesky influencers (e.g., `https://frontend-url/join/{campaign_id}?bksy={handle}`).
- Save these invite records to the database with a status like `pending_dm`.

#### [MODIFY] `fastapi_backend/models/campaign_schemas.py`
- Add `BlueskyInviteRequest` schema.

---

### Frontend (Bun/React)

#### [NEW] `bun_frontend/src/pages/JoinInvite.tsx`
- A public landing page where the Bluesky influencer lands after clicking the link in their DMs.
- Displays the campaign details and an "Accept & Join" call to action.

#### [MODIFY] `bun_frontend/src/routes/AppRoutes.tsx`
- Map the route: `<Route path="/join/:campaignId" element={<JoinInvite />} />`.

#### [MODIFY] `bun_frontend/src/pages/SignupInfluencer.tsx`
- Ensure that if the signup is preceded by an invite link, the resulting new user is automatically mapped and added to the respective sponsor's campaign dashboard as "Accepted".

## Open Questions

> [!WARNING]  
> Is the priority right now strictly building the backend API structure to hit TinyFish, or do you want to see the new Frontend "Join" pages first?

## Verification Plan

### Automated Tests
- Validate the internal logic of link generation and `BlueskyInviteRequest` schemas via mocked Pytest tests simulating the API payload. 

### Manual Verification
- Execute a test run targeting a test Bluesky account dummy profile using a real TinyFish payload to confirm DMs land correctly and the redirect link works.
