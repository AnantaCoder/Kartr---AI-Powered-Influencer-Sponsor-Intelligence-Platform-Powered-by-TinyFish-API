"""
Test script to verify the video analysis service with Gemini AI.
"""
import sys
import os

# Add parent directory to path to allow imports from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.analysis_service import analyze_influencer_sponsors

def test_analyze_video():
    """Test video analysis with a sample YouTube video."""
    print("=" * 60)
    print("Testing Video Analysis Service with Gemini AI")
    print("=" * 60)
    
    # Use a sample YouTube video URL (MrBeast is known for sponsors)
    test_video_url = "https://www.youtube.com/watch?v=TQHEJj68Jew"
    
    print(f"\n[INFO] Analyzing video: {test_video_url}")
    print("-" * 60)
    
    try:
        result = analyze_influencer_sponsors(test_video_url)
        
        if "error" in result and not "analysis" in result:
            print(f"[ERROR] Failed to get video data: {result['error']}")
            return False
        
        # Print video details
        print("\n[VIDEO INFO]")
        print(f"  Title: {result.get('title', 'N/A')}")
        print(f"  Channel: {result.get('channel_title', 'N/A')}")
        print(f"  Views: {result.get('view_count', 0):,}")
        print(f"  Likes: {result.get('like_count', 0):,}")
        
        # Print analysis results
        analysis = result.get("analysis", {})
        print("\n[AI ANALYSIS]")
        
        if "error" in analysis:
            print(f"  Error: {analysis['error']}")
            if "raw_response" in analysis:
                print(f"  Raw Response: {analysis['raw_response'][:200]}...")
            return False
        
        print(f"  Is Sponsored: {analysis.get('is_sponsored', 'Unknown')}")
        print(f"  Sponsor Name: {analysis.get('sponsor_name', 'N/A')}")
        print(f"  Sponsor Industry: {analysis.get('sponsor_industry', 'N/A')}")
        print(f"  Influencer Niche: {analysis.get('influencer_niche', 'N/A')}")
        print(f"  Sentiment: {analysis.get('sentiment', 'N/A')}")
        print(f"  Key Topics: {', '.join(analysis.get('key_topics', []))}")
        print(f"\n  Summary: {analysis.get('content_summary', 'N/A')}")
        
        print("\n" + "=" * 60)
        print("[SUCCESS] Video analysis completed successfully!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Test failed with exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_analyze_video()
    sys.exit(0 if success else 1)
