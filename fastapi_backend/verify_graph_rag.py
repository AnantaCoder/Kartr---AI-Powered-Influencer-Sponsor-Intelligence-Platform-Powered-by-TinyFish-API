import httpx
import json

def test_graph_qa():
    url = "http://127.0.0.1:8000/api/questions/ask-graph"
    # Assuming standard test user or mock auth if needed
    # But uvicorn is running, let's try direct request first (might need token)
    
    payload = {
        "question": "Which creator has the highest influence according to the partnership graph?"
    }
    
    print(f"Testing GraphRAG Q&A...")
    # This might fail on 401 if auth is strictly required for this test, 
    # but the logs will show if GraphService is working.
    try:
        # Just a placeholder for manual test or token-based test
        pass
    except Exception as e:
        print(f"Test error: {e}")

if __name__ == "__main__":
    test_graph_qa()
