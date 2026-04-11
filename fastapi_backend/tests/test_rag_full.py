"""
Complete RAG Pipeline Test
Tests retrieval and AI-powered question answering
"""
import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from config import settings
from database import is_firebase_configured
from firebase_config import FirestoreRepository
import pandas as pd

async def _get_rag_context(keywords):
    """Retrieve relevant context from Firebase or CSV"""
    print(f"\n🔍 Searching for context with keywords: {keywords}")
    
    if is_firebase_configured():
        print("📁 Using Firebase Firestore...")
        try:
            analyses_repo = FirestoreRepository('video_analyses')
            analyses = analyses_repo.find_all(limit=100)
            
            relevant = []
            for row in analyses:
                row_str = str(row).lower()
                if any(kw in row_str for kw in keywords):
                    relevant.append(row)
                    if len(relevant) >= 10:
                        break
            
            if not relevant:
                return "No relevant data found in Firebase."
            
            context = "\n".join([
                f"Creator: {r.get('creator_name')}, Industry: {r.get('creator_industry')}, "
                f"Sponsor: {r.get('sponsor_name')}, Sponsor Industry: {r.get('sponsor_industry')}, "
                f"Video: {r.get('video_title')}"
                for r in relevant
            ])
            return context
        except Exception as e:
            print(f"❌ Firebase error: {e}")
            return "Error retrieving from Firebase."
    else:
        print("📄 Using CSV Fallback...")
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'analysis_results.csv')
        if not os.path.exists(csv_path):
            return "CSV file does not exist."
        
        try:
            df = pd.read_csv(csv_path)
            mask = df.apply(lambda row: any(kw in str(row).lower() for kw in keywords), axis=1)
            relevant_df = df[mask].head(10)
            
            if relevant_df.empty:
                return "No relevant data found in CSV."
            
            return relevant_df.to_string(index=False)
        except Exception as e:
            print(f"❌ CSV error: {e}")
            return "Error retrieving from CSV."

async def test_rag_full():
    print("\n" + "="*70)
    print("  🧠 RAG PIPELINE END-TO-END TEST")
    print("="*70)
    
    # 1. Ask a question
    question = "Which creator is sponsored by DripCoffee?"
    print(f"\n❓ Question: {question}")
    
    # 2. Get context
    keywords = question.lower().replace("?", "").split()
    context = await _get_rag_context(keywords)
    
    print("\n📦 Retrieved Context:")
    print("-" * 40)
    print(context)
    print("-" * 40)
    
    # 3. Generate answer using Groq (since we've been using it as our reliable fallback)
    print("\n🤖 Generating answer via Groq AI...")
    
    if not settings.GROQ_API_KEY:
        print("❌ GROQ_API_KEY not configured. Cannot test AI generation.")
        return
    
    prompt = f"""Based on the following data about creators and sponsors:

{context}

Answer this question: {question}

Provide a helpful and concise answer based only on the data provided."""

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": "You are a helpful analytics assistant."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 512
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                answer = data['choices'][0]['message']['content'].strip()
                
                print("\n✨ AI Answer:")
                print("-" * 40)
                print(answer)
                print("-" * 40)
                
                print("\n✅ RAG Pipeline test PASSED!")
            else:
                print(f"\n❌ Groq API error: {response.status_code}")
                print(response.text)
                
    except Exception as e:
        print(f"\n❌ Error during AI generation: {e}")

if __name__ == "__main__":
    asyncio.run(test_rag_full())
