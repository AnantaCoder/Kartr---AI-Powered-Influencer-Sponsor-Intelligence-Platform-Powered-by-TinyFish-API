"""
Feature Demo Generator for MVP
Generates and saves image-caption pairs and RAG results for demo purposes.
"""
import asyncio
import os
import sys
import json
import httpx
import urllib.parse
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from config import settings
from firebase_config import FirestoreRepository
from database import is_firebase_configured

async def generate_image_demo():
    print("\n🎨 Generating Image-Caption MVP Demo...")
    
    prompt = "tech influencer reviewing a gaming laptop"
    brand = "TechPro"
    
    # 1. Enhance Prompt & Generate Caption
    print("🔄 Calling Groq for enhancement and caption...")
    groq_prompt = (
        f"1. Create a detailed image generation prompt for: '{prompt}' for brand '{brand}'.\n"
        f"2. Create a catchy social media caption for this.\n"
        "Return as JSON with keys 'enhanced_prompt' and 'caption'."
    )
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": groq_prompt}],
        "temperature": 0.7,
        "response_format": {"type": "json_object"}
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        res_data = response.json()
        content = json.loads(res_data['choices'][0]['message']['content'])
        enhanced_prompt = content['enhanced_prompt']
        caption = content['caption']
        
    print(f"✅ Caption: {caption[:50]}...")
    
    # 2. Generate Image
    print("🖼️  Generating image via Pollinations...")
    encoded = urllib.parse.quote(enhanced_prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true"
    
    async with httpx.AsyncClient(timeout=30.0) as img_client:
        img_res = await img_client.get(image_url)
        image_data = img_res.content
        
    # 3. Save to Demo Folder
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    demo_dir = os.path.join(os.path.dirname(__file__), 'data', 'demo', 'image_captions')
    os.makedirs(demo_dir, exist_ok=True)
    
    image_path = os.path.join(demo_dir, f"mvp_image_{timestamp}.png")
    text_path = os.path.join(demo_dir, f"mvp_image_{timestamp}.txt")
    
    with open(image_path, 'wb') as f:
        f.write(image_data)
        
    with open(text_path, 'w') as f:
        f.write(f"PROMPT: {prompt}\n")
        f.write(f"ENHANCED: {enhanced_prompt}\n")
        f.write(f"CAPTION: {caption}\n")
        
    print(f"✅ Saved MVP Image Demo to {demo_dir}")

async def generate_rag_demo():
    print("\n🧠 Generating RAG MVP Demo...")
    
    question = "Who are the top tech reviewers and who sponsors them?"
    keywords = ["tech", "reviewer", "sponsor"]
    
    # 1. Retrieve Context
    print("🔍 Retrieving context from database...")
    context = ""
    if is_firebase_configured():
        repo = FirestoreRepository('video_analyses')
        analyses = repo.find_all(limit=50)
        relevant = [r for r in analyses if any(kw in str(r).lower() for kw in keywords)]
        context = "\n".join([f"Creator: {r.get('creator_name')}, Sponsor: {r.get('sponsor_name')}" for r in relevant[:5]])
    
    if not context:
        context = "No specific records found for 'tech reviewer'."
        
    # 2. Generate Answer
    print("🤖 Generating answer via Groq...")
    prompt = f"Based on this data:\n{context}\n\nQuestion: {question}\n\nAnswer helpfully based ONLY on the data."
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        res_data = response.json()
        answer = res_data['choices'][0]['message']['content'].strip()
        
    # 3. Save to Demo Folder
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    demo_dir = os.path.join(os.path.dirname(__file__), 'data', 'demo', 'rag_results')
    os.makedirs(demo_dir, exist_ok=True)
    
    result_path = os.path.join(demo_dir, f"mvp_rag_demo_{timestamp}.json")
    demo_data = {
        "question": question,
        "context": context,
        "answer": answer,
        "timestamp": timestamp
    }
    
    with open(result_path, 'w') as f:
        json.dump(demo_data, f, indent=2)
        
    print(f"✅ Saved MVP RAG Demo to {demo_dir}")

async def main():
    await generate_image_demo()
    await generate_rag_demo()
    print("\n🚀 MVP Demo Generation Complete!")

if __name__ == "__main__":
    asyncio.run(main())
