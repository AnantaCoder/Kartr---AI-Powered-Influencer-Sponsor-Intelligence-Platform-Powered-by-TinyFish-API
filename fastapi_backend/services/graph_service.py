import networkx as nx
import pandas as pd
import os
import logging
from typing import Dict, Any, List, Optional
from firebase_config import FirestoreRepository

logger = logging.getLogger(__name__)

class GraphService:
    """
    Service for structural graph analysis (GraphRAG).
    Computes centrality and topology metrics from creator-sponsor relationships.
    """
    
    @staticmethod
    def get_structural_context() -> str:
        """
        Builds a summary of the creator-sponsor graph topology for LLM context.
        """
        try:
            # 1. Load data
            nodes, edges = GraphService._load_graph_data()
            if not edges:
                return "Graph data is currently empty."

            # 2. Build NetworkX graph
            G = nx.Graph()
            for edge in edges:
                G.add_edge(edge['source'], edge['target'])

            # 3. Compute metrics
            # Degree Centrality (Influence)
            centrality = nx.degree_centrality(G)
            sorted_centrality = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
            
            # Topological summary
            num_nodes = G.number_of_nodes()
            num_edges = G.number_of_edges()
            connected_components = nx.number_connected_components(G)
            
            top_influencers = [f"{node} (score: {score:.2f})" for node, score in sorted_centrality[:5]]
            
            context = [
                "### ECOSYSTEM TOPOLOGY (Graph Analysis):",
                f"- Total Entities (Creators/Sponsors): {num_nodes}",
                f"- Total Partnerships (Edges): {num_edges}",
                f"- Market Clusters (Connected Components): {connected_components}",
                f"- Top 5 Most Influential Entities (Centrality): {', '.join(top_influencers)}",
                "\nRELATIONSHIP DETAILS:"
            ]
            
            # Add some connectivity details
            for node, score in sorted_centrality[:10]:
                neighbors = list(G.neighbors(node))
                context.append(f"- {node} is connected to: {', '.join(neighbors[:5])}{'...' if len(neighbors) > 5 else ''}")

            return "\n".join(context)
            
        except Exception as e:
            logger.error(f"GraphService Error: {e}")
            return f"Error computing graph topology: {str(e)}"

    @staticmethod
    def _load_graph_data():
        """Helper to load nodes and edges (similar to visualization router)."""
        # For efficiency, we just grab edges for topology
        analyses_repo = FirestoreRepository('video_analyses')
        analyses = analyses_repo.find_all(limit=500)
        
        edges = []
        nodes = set()
        for row in analyses:
            creator = row.get('creator_name', 'Unknown')
            sponsor = row.get('sponsor_name', 'No Sponsor')
            
            if sponsor and sponsor != 'No Sponsor':
                edges.append({"source": creator, "target": sponsor})
                nodes.add(creator)
                nodes.add(sponsor)
        
        return list(nodes), edges

graph_service = GraphService()
