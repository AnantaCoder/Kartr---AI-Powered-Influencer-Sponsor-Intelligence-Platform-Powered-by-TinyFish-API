"""
Search router - Search users, channels, and suggestions
"""
import logging
import os
from typing import List
from fastapi import APIRouter, Query, Depends
from models.schemas import SearchResponse, SearchSuggestion
from database import get_supabase_client, get_mock_db
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    current_user: dict = Depends(get_current_user)
):
    """
    Search for users and YouTube channels.
    """
    query = q.strip()
    channels = []
    users = []
    
    # Search in database
    supabase = get_supabase_client()
    
    if supabase:
        try:
            # Search channels
            channel_result = supabase.table("youtube_channels").select("*").ilike("title", f"%{query}%").execute()
            channels = channel_result.data if channel_result.data else []
            
            # Search users (only those with public email)
            user_result = supabase.table("users").select("*").eq("email_visible", True).or_(
                f"username.ilike.%{query}%,email.ilike.%{query}%"
            ).execute()
            users = user_result.data if user_result.data else []
        except Exception as e:
            logger.error(f"Supabase search error: {e}")
    else:
        # Fallback to mock database
        mock_db = get_mock_db()
        channels = mock_db.search_channels(query)
    
    # Also search in database.csv for users
    try:
        import pandas as pd
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'database.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            if 'public_email' in df.columns:
                user_matches = df[
                    (df['username'].str.contains(query, case=False, na=False) | 
                     df['email'].str.contains(query, case=False, na=False)) &
                    (df['public_email'].astype(str) == 'True')
                ]
                if not user_matches.empty:
                    users.extend(user_matches.to_dict('records'))
    except Exception as e:
        logger.error(f"CSV search error: {e}")
    
    # Remove duplicates from users based on email
    seen_emails = set()
    unique_users = []
    for user in users:
        email = user.get('email')
        if email and email not in seen_emails:
            seen_emails.add(email)
            unique_users.append(user)
    
    return SearchResponse(
        channels=channels,
        users=unique_users,
        query=query
    )


@router.get("/suggestions", response_model=List[SearchSuggestion])
async def search_suggestions(
    q: str = Query(..., min_length=2, description="Search query for suggestions")
):
    """
    Get search suggestions for autocomplete.
    """
    query = q.strip().lower()
    suggestions = []
    
    # Search channels
    supabase = get_supabase_client()
    
    if supabase:
        try:
            channel_result = supabase.table("youtube_channels").select("id,title").ilike("title", f"%{query}%").limit(5).execute()
            for channel in channel_result.data or []:
                suggestions.append(SearchSuggestion(
                    id=f"channel_{channel['id']}",
                    text=channel['title'],
                    type="channel"
                ))
        except Exception as e:
            logger.error(f"Supabase suggestion error: {e}")
    else:
        mock_db = get_mock_db()
        channels = mock_db.search_channels(query)[:5]
        for channel in channels:
            suggestions.append(SearchSuggestion(
                id=f"channel_{channel.get('id')}",
                text=channel.get('title', ''),
                type="channel"
            ))
    
    # Search users from CSV
    try:
        import pandas as pd
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'database.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            if 'public_email' in df.columns:
                user_matches = df[
                    (df['username'].str.contains(query, case=False, na=False)) &
                    (df['public_email'].astype(str) == 'True')
                ].head(5)
                
                for _, user in user_matches.iterrows():
                    suggestions.append(SearchSuggestion(
                        id=f"user_{user.get('username')}",
                        text=user.get('username', ''),
                        type=user.get('user_type', 'influencer'),
                        email=user.get('email')
                    ))
    except Exception as e:
        logger.error(f"CSV suggestion error: {e}")
    
    return suggestions[:10]  # Limit to 10 suggestions
