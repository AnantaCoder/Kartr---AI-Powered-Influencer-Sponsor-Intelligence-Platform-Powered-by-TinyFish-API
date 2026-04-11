
import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore
import datetime

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

def seed_database():
    print("Initializing Firebase for seeding...")
    
    # Check if firebase is already initialized
    if not firebase_admin._apps:
        # Load credentials logic similar to firebase_config.py
        cred_path = settings.FIREBASE_CREDENTIALS
        
        # Try to find the file if it's a relative path
        if not os.path.isabs(cred_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            possible_path = os.path.join(base_dir, cred_path)
            if os.path.exists(possible_path):
                cred_path = possible_path
            else:
                # Try common names
                for name in ['kartr-firebase-adminsdk.json', 'firebase-service-account.json']:
                    possible_path = os.path.join(base_dir, name)
                    if os.path.exists(possible_path):
                        cred_path = possible_path
                        break
        
        print(f"Loading credentials from: {cred_path}")
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
            return

    db = firestore.client()
    collection_ref = db.collection('video_analyses')
    
    # Sample Data
    samples = [
        {
            "video_id": "vid_001",
            "video_title": "My Morning Routine | Sponsored by DripCoffee",
            "creator_name": "SarahLifestyle",
            "creator_industry": "Lifestyle",
            "sponsor_name": "DripCoffee",
            "sponsor_industry": "Food & Beverage",
            "is_sponsored": True,
            "sentiment": "Positive",
            "analysis_date": datetime.datetime.now(),
            "content_summary": "Sarah shows her morning routine including making coffee with DripCoffee machine."
        },
        {
            "video_id": "vid_002",
            "video_title": "Top 10 Tech Gadgets 2024",
            "creator_name": "TechReviewerPro",
            "creator_industry": "Technology",
            "sponsor_name": "VPNGuard",
            "sponsor_industry": "Software",
            "is_sponsored": True,
            "sentiment": "Neutral",
            "analysis_date": datetime.datetime.now(),
            "content_summary": "Review of new gadgets with a mid-roll ad for VPNGuard."
        },
        {
            "video_id": "vid_003",
            "video_title": "How to Code in Python - Flask Tutorial",
            "creator_name": "CodeMaster",
            "creator_industry": "Education",
            "sponsor_name": "CloudHosting",
            "sponsor_industry": "Technology",
            "is_sponsored": True,
            "sentiment": "Positive",
            "analysis_date": datetime.datetime.now(),
            "content_summary": "Tutorial on Flask with a shoutout to CloudHosting for server space."
        },
        {
            "video_id": "vid_004",
            "video_title": "Travel Vlog: Japan",
            "creator_name": "WanderlustJenny",
            "creator_industry": "Travel",
            "sponsor_name": "No Sponsor",
            "sponsor_industry": "N/A",
            "is_sponsored": False,
            "sentiment": "Positive",
            "analysis_date": datetime.datetime.now(),
            "content_summary": "Vlog about trip to Tokyo and Kyoto."
        },
        {
            "video_id": "vid_005",
            "video_title": "Fitness Challenge 30 Days",
            "creator_name": "FitFamMike",
            "creator_industry": "Fitness",
            "sponsor_name": "ProteinPower",
            "sponsor_industry": "Health & Wellness",
            "is_sponsored": True,
            "sentiment": "Positive",
            "analysis_date": datetime.datetime.now(),
            "content_summary": "30 day workout challenge sponsored by ProteinPower supplements."
        }
    ]
    
    print(f"Seeding {len(samples)} documents into 'video_analyses'...")
    
    for doc in samples:
        # Use video_id as document ID to avoid duplicates
        doc_ref = collection_ref.document(doc['video_id'])
        doc_ref.set(doc)
        print(f"Added: {doc['video_title']}")
        
    print("Seeding complete!")

if __name__ == "__main__":
    seed_database()
