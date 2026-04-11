import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from firebase_config import FirestoreRepository
from database import is_firebase_configured

def main():
    print('Firebase connected' if is_firebase_configured() else 'Firebase not connected')
    repo = FirestoreRepository('video_analyses')
    results = repo.find_all(limit=10)
    print(f"Total records found: {len(results)}")
    for r in results:
        print(f"Video: {r.get('video_title')}")
        print(f"Creator: {r.get('creator_name')}")
        print(f"Sponsor: {r.get('sponsor_name')}")
        print(f"Keywords: {r.get('key_topics', [])}")
        print('---')

if __name__ == "__main__":
    main()
