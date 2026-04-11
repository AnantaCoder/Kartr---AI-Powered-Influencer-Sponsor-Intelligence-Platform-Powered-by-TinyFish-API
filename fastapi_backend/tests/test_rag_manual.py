import sys
import os
import asyncio
from unittest.mock import MagicMock

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import is_firebase_configured
from firebase_config import FirestoreRepository
import pandas as pd

# Mock settings for testing if needed
import config
config.settings.GEMINI_API_KEY = "test_key"

def _get_rag_context_from_firebase(keywords, limit=100):
    print(f"Testing Firebase retrieval with keywords: {keywords}")
    try:
        analyses_repo = FirestoreRepository('video_analyses')
        analyses = analyses_repo.find_all(limit=limit)
        print(f"Fetched {len(analyses)} records from Firestore.")
        
        relevant = []
        for row in analyses:
            row_str = str(row).lower()
            if any(kw in row_str for kw in keywords):
                relevant.append(row)
                if len(relevant) >= 10:
                    break
        print(f"Found {len(relevant)} relevant records.")
        return relevant
    except Exception as e:
        print(f"Firebase error: {e}")
        return []

def _get_rag_context_from_csv(keywords):
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'analysis_results.csv')
    print(f"Testing CSV retrieval from: {csv_path}")
    
    if not os.path.exists(csv_path):
        print("CSV file does not exist.")
        return []

    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded CSV with {len(df)} rows.")
        mask = df.apply(lambda row: any(kw in str(row).lower() for kw in keywords), axis=1)
        relevant_df = df[mask].head(10)
        print(f"Found {len(relevant_df)} relevant records.")
        return relevant_df.to_dict('records')
    except Exception as e:
        print(f"CSV error: {e}")
        return []

async def test_rag():
    question = "Who are the sponsors?"
    keywords = question.lower().split()
    
    if is_firebase_configured():
        print("Firebase is configured.")
        _get_rag_context_from_firebase(keywords)
    else:
        print("Firebase NOT configured. Using CSV fallback.")
        _get_rag_context_from_csv(keywords)

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    loop.run_until_complete(test_rag())
