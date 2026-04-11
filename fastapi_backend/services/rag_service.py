import os
import json
import logging
import pandas as pd
from typing import List, Dict, Any, Optional
from firebase_config import FirestoreRepository
from database import is_firebase_configured

logger = logging.getLogger(__name__)

# Constants (moved from visualization_router)
MAX_RAG_RECORDS = 100
MAX_RAG_RESULTS = 10
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
CSV_PATH = os.path.join(DATA_DIR, 'analysis_results.csv')

class RagService:
    """
    Centralized service for Retrieval Augmented Generation (RAG) context.
    Shared by ChatService and Visualization systems.
    """

    @classmethod
    def get_context(cls, keywords: List[str]) -> str:
        """
        Main entry point for context retrieval.
        Tries Firebase first, then CSV/Local demo files.
        """
        # Filter common useless words and small keywords
        stop_words = {'what', 'with', 'tell', 'show', 'about', 'kartr', 'from', 'this', 'that', 'were', 'been', 'each', 'does'}
        clean_keywords = [
            kw.lower().strip('?,.!') 
            for kw in keywords 
            if len(kw) > 2 and kw.lower() not in stop_words
        ]
        
        if not clean_keywords:
            clean_keywords = [kw.lower() for kw in keywords if len(kw) > 0]

        parts = []
        
        # 1. Try Firebase
        if is_firebase_configured():
            fb_context = cls._get_rag_context_from_firebase(clean_keywords)
            if fb_context and fb_context != "No data available.":
                parts.append(f"### PLATFORM DATA (REAL-TIME):\n{fb_context}")

        # 2. Try CSV/Local Demo (Fallback/Legacy)
        local_context = cls._get_rag_context_from_local(clean_keywords)
        if local_context and local_context != "No data available.":
            parts.append(f"### EXTERNAL KNOWLEDGE/DEMO:\n{local_context}")

        if not parts:
            return "No specific platform data found for this query."
            
        return "\n\n---\n\n".join(parts)

    @classmethod
    def _get_rag_context_from_firebase(cls, keywords: List[str]) -> str:
        """Retrieve relevant context from Firebase video_analyses."""
        try:
            analyses_repo = FirestoreRepository('video_analyses')
            analyses = analyses_repo.find_all(limit=MAX_RAG_RECORDS)
            
            relevant = []
            for row in analyses:
                row_str = str(row).lower()
                if any(kw.lower() in row_str for kw in keywords):
                    relevant.append(row)
                    if len(relevant) >= MAX_RAG_RESULTS:
                        break
            
            if not relevant:
                return "No data available."
            
            return "\n".join([
                f"- Creator: {r.get('creator_name')}, Industry: {r.get('creator_industry')}, "
                f"Sponsor: {r.get('sponsor_name')}, Video: {r.get('video_title')}"
                for r in relevant
            ])
        except Exception as e:
            logger.error(f"Error fetching Firestore RAG context: {e}")
            return "No data available."

    @classmethod
    def _get_rag_context_from_local(cls, keywords: List[str]) -> str:
        """Retrieve context from local CSV or Demo Result files."""
        # A. Check Demo Results JSON
        demo_rag_dir = os.path.join(DATA_DIR, 'demo', 'rag_results')
        demo_parts = []
        if os.path.exists(demo_rag_dir):
            for filename in os.listdir(demo_rag_dir):
                if filename.endswith('.json'):
                    try:
                        with open(os.path.join(demo_rag_dir, filename), 'r') as f:
                            data = json.load(f)
                            content_str = str(data).lower()
                            if any(kw.lower() in content_str for kw in keywords):
                                demo_parts.append(f"Source: {filename}\nContent: {data.get('context', '')}")
                    except: continue

        # B. Check CSV Fallback
        if os.path.exists(CSV_PATH):
            try:
                df = pd.read_csv(CSV_PATH)
                mask = df.apply(lambda row: any(kw.lower() in str(row).lower() for kw in keywords), axis=1)
                relevant_df = df[mask].head(MAX_RAG_RESULTS)
                if not relevant_df.empty:
                    demo_parts.append(f"Source: Platform Registry (CSV)\n{relevant_df.to_string(index=False)}")
            except Exception as e:
                logger.warning(f"Error reading CSV for RAG: {e}")

        return "\n\n".join(demo_parts) if demo_parts else "No data available."
