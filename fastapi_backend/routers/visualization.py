"""
Visualization Router - Graphs and RAG-based Q&A

This module provides endpoints for:
- Creator-sponsor relationship graphs
- Industry relationship graphs
- RAG-based question answering using Gemini AI
- Dashboard visualization data
"""
import logging
import os
from typing import Dict, Any, List

# Third-party imports
import pandas as pd
import google.generativeai as genai
import httpx
from fastapi import APIRouter, Depends

# Local imports
from config import settings
from database import is_firebase_configured
from firebase_config import FirestoreRepository
from models.schemas import GraphData, QuestionRequest, QuestionResponse
from utils.dependencies import get_current_user
from services.graph_service import graph_service


# =============================================================================
# Configuration
# =============================================================================

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Visualization & Q&A"])

# Constants
MAX_GRAPH_RECORDS = 500
MAX_RAG_RECORDS = 100
MAX_RAG_RESULTS = 10
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
CSV_PATH = os.path.join(DATA_DIR, 'analysis_results.csv')


# =============================================================================
# Helper Functions - Graph Data Loading
# =============================================================================

def _build_graph_from_firebase(field_creator: str, field_sponsor: str, 
                                type_creator: str, type_sponsor: str,
                                skip_value: str = 'No Sponsor') -> Dict[str, Any]:
    """
    Build graph data from Firebase video_analyses collection.
    
    Args:
        field_creator: Field name for creator data
        field_sponsor: Field name for sponsor data
        type_creator: Node type for creators
        type_sponsor: Node type for sponsors
        skip_value: Value to skip for sponsor (e.g., 'No Sponsor', 'N/A')
    
    Returns:
        Dict with nodes and edges, or empty if no data
    """
    nodes = []
    edges = []
    node_ids = set()
    
    analyses_repo = FirestoreRepository('video_analyses')
    analyses = analyses_repo.find_all(limit=MAX_GRAPH_RECORDS)
    
    for row in analyses:
        creator = row.get(field_creator, 'Unknown')
        sponsor = row.get(field_sponsor, 'Unknown')
        
        # Add creator node
        if creator and creator not in node_ids:
            nodes.append({"id": creator, "type": type_creator})
            node_ids.add(creator)
        
        # Add sponsor node (skip placeholder values)
        if sponsor and sponsor != skip_value and sponsor not in node_ids:
            nodes.append({"id": sponsor, "type": type_sponsor})
            node_ids.add(sponsor)
        
        # Add edge
        if sponsor and sponsor != skip_value:
            edges.append({"source": creator, "target": sponsor})
    
    return {"nodes": nodes, "edges": edges} if (nodes or edges) else None


def _build_graph_from_csv(col_creator: str, col_sponsor: str,
                          type_creator: str, type_sponsor: str,
                          skip_value: str = 'No Sponsor') -> Dict[str, Any]:
    """
    Build graph data from CSV file (fallback).
    
    Args:
        col_creator: Column name for creator data
        col_sponsor: Column name for sponsor data
        type_creator: Node type for creators
        type_sponsor: Node type for sponsors
        skip_value: Value to skip for sponsor
    
    Returns:
        Dict with nodes and edges
    """
    nodes = []
    edges = []
    node_ids = set()
    
    if not os.path.exists(CSV_PATH):
        return {"nodes": [], "edges": []}
    
    df = pd.read_csv(CSV_PATH)
    
    for _, row in df.iterrows():
        creator = row.get(col_creator, 'Unknown')
        sponsor = row.get(col_sponsor, 'Unknown')
        
        if creator not in node_ids:
            nodes.append({"id": creator, "type": type_creator})
            node_ids.add(creator)
        
        if sponsor != skip_value and sponsor not in node_ids:
            nodes.append({"id": sponsor, "type": type_sponsor})
            node_ids.add(sponsor)
        
        if sponsor != skip_value:
            edges.append({"source": creator, "target": sponsor})
    
    return {"nodes": nodes, "edges": edges}


def load_creator_sponsor_graph() -> Dict[str, Any]:
    """Load creator-sponsor relationship graph from Firebase or CSV fallback."""
    try:
        # Try Firebase first
        if is_firebase_configured():
            result = _build_graph_from_firebase(
                field_creator='creator_name',
                field_sponsor='sponsor_name',
                type_creator='creator',
                type_sponsor='sponsor',
                skip_value='No Sponsor'
            )
            if result:
                return result
        
        # Fallback to CSV
        return _build_graph_from_csv(
            col_creator='Creator Name',
            col_sponsor='Sponsor Name',
            type_creator='creator',
            type_sponsor='sponsor',
            skip_value='No Sponsor'
        )
        
    except Exception as e:
        logger.error(f"Error loading creator-sponsor graph: {e}")
        return {"nodes": [], "edges": [], "error": str(e)}


def load_industry_graph() -> Dict[str, Any]:
    """Load industry relationship graph from Firebase or CSV fallback."""
    try:
        # Try Firebase first
        if is_firebase_configured():
            result = _build_graph_from_firebase(
                field_creator='creator_industry',
                field_sponsor='sponsor_industry',
                type_creator='creator_industry',
                type_sponsor='sponsor_industry',
                skip_value='N/A'
            )
            if result:
                return result
        
        # Fallback to CSV
        return _build_graph_from_csv(
            col_creator='Creator Industry',
            col_sponsor='Sponsor Industry',
            type_creator='creator_industry',
            type_sponsor='sponsor_industry',
            skip_value='N/A'
        )
        
    except Exception as e:
        logger.error(f"Error loading industry graph: {e}")
        return {"nodes": [], "edges": [], "error": str(e)}


# =============================================================================
# Helper Functions - RAG Context Building
# =============================================================================

# Note: RAG Logic has been moved to services/rag_service.py for centralized use.


# =============================================================================
# API Endpoints - Graphs
# =============================================================================

@router.get("/graphs/creator-sponsor")
async def get_creator_sponsor_graph(current_user: dict = Depends(get_current_user)):
    """
    Get creator-sponsor relationship graph data.
    
    Returns nodes (creators, sponsors) and edges (partnerships) for visualization.
    """
    return load_creator_sponsor_graph()


@router.get("/graphs/industry")
async def get_industry_graph(current_user: dict = Depends(get_current_user)):
    """
    Get industry relationship graph data.
    
    Returns nodes (industries) and edges (cross-industry partnerships) for visualization.
    """
    return load_industry_graph()


# =============================================================================
# API Endpoints - RAG Q&A
# =============================================================================

@router.post("/questions/ask", response_model=QuestionResponse)
async def ask_question(
    request: QuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Answer questions using RAG (Retrieval Augmented Generation).
    
    Searches analysis data for relevant context and uses Gemini AI
    to generate an answer based on the retrieved data.
    """
    try:
        if not settings.GEMINI_API_KEY:
            return QuestionResponse(answer="Gemini API key not configured.")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        keywords = request.question.lower().split()
        
        from services.rag_service import RagService
        context = RagService.get_context(keywords)
        
        # Generate answer using Gemini 1.5
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_TEXT_MODEL,
            system_instruction="You are a data analyst for Kartr. Use the provided context to answer questions accurately and concisely."
        )
        prompt = f"""Based on the following data about creators and sponsors:

{context}

Answer this question: {request.question}

Provide a helpful and concise answer based only on the data provided."""
        
        try:
            response = model.generate_content(prompt)
            answer = response.text if response.text else None
        except Exception as gem_err:
            logger.warning(f"Gemini failed, falling back to Groq: {gem_err}")
            answer = None
        
        if not answer:
            answer = await _ask_groq(prompt)
            
        return QuestionResponse(answer=answer)
        
    except ImportError:
        return QuestionResponse(answer="Google Generative AI module not available.")
    except Exception as e:
        logger.error(f"Question answering error: {e}")
        return QuestionResponse(answer=f"Error processing question: {str(e)}")


async def _ask_groq(prompt: str, system_instruction: str = "You are a helpful data analyst for Kartr.") -> str:
    """Helper to call Groq API"""
    if not settings.GROQ_API_KEY:
        return "Groq API key not configured."
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1024
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content'].strip()
    except Exception as e:
        logger.error(f"Groq API Error: {e}")
        return f"Error connecting to Groq: {str(e)}"


@router.post("/questions/ask-graph", response_model=QuestionResponse)
async def ask_graph_question(
    request: QuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Answer questions about graph data using Graph-Augmented Retrieval.
    """
    try:
        # 1. Get Structural Topology Context
        graph_context = graph_service.get_structural_context()
        
        # 2. Build Prompt
        prompt = f"""STRUCTURAL TOPOLOGY DATA:
{graph_context}

USER QUESTION: {request.question}

Please analyze the influence and connections provided in the topology to answer the user's question. If you cannot find a direct answer, explain what the graph shows about the entities mentioned."""

        # 3. Use Groq for faster/more reliable structural analysis
        answer = await _ask_groq(
            prompt=prompt,
            system_instruction="You are a Graph Data Analyst for Kartr. Use the provided network topology metrics (Degree Centrality, influence rankings) to answer questions specifically about the ecosystem's structure and connectivity."
        )
        
        return QuestionResponse(answer=answer)
        
    except Exception as e:
        logger.error(f"Graph Q&A Error: {e}")
        return QuestionResponse(answer=f"Error analyzing graph: {str(e)}")


# =============================================================================
# API Endpoints - Dashboard Data
# =============================================================================

@router.get("/visualization/data")
async def get_visualization_data(current_user: dict = Depends(get_current_user)):
    """
    Get all visualization data for the dashboard.
    
    Returns summary statistics and recent analyses.
    """
    try:
        # Try Firebase first
        if is_firebase_configured():
            analyses_repo = FirestoreRepository('video_analyses')
            analyses = analyses_repo.find_all(limit=100)
            
            creators = set(a.get('creator_name') for a in analyses if a.get('creator_name'))
            sponsors = set(a.get('sponsor_name') for a in analyses 
                          if a.get('sponsor_name') and a.get('sponsor_name') != 'No Sponsor')
            
            return {
                "total_analyses": len(analyses),
                "unique_creators": len(creators),
                "unique_sponsors": len(sponsors),
                "recent_analyses": analyses[-10:] if analyses else []
            }
        
        # Fallback to CSV
        if os.path.exists(CSV_PATH):
            df = pd.read_csv(CSV_PATH)
            
            return {
                "total_analyses": len(df),
                "unique_creators": df['Creator Name'].nunique() if 'Creator Name' in df.columns else 0,
                "unique_sponsors": df['Sponsor Name'].nunique() if 'Sponsor Name' in df.columns else 0,
                "recent_analyses": df.tail(10).to_dict('records')
            }
        
        return {
            "total_analyses": 0,
            "unique_creators": 0,
            "unique_sponsors": 0,
            "recent_analyses": []
        }
        
    except Exception as e:
        logger.error(f"Error getting visualization data: {e}")
        return {"error": str(e)}
