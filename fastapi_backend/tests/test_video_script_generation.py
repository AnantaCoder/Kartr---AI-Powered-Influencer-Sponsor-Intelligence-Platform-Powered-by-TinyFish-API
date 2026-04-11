"""
Test Video Script Generation Feature
Demonstrates Groq-powered video script creation
"""
import asyncio
import sys
import os
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.video_script import VideoScriptRequest, generate_video_script


class MockUser:
    """Mock user for testing"""
    def get(self, key, default=None):
        return "test_user" if key == "uid" else default


async def test_video_script_generation():
    """Test the video script generation feature"""
    print("\n" + "="*70)
    print(" GROQ VIDEO SCRIPT GENERATION TEST")
    print("="*70)
    
    # Test request
    request = VideoScriptRequest(
        topic="Laptop Review for Content Creators",
        brand_name="TechPro",
        duration_seconds=60,
        target_audience="content creators and video editors",
        tone="enthusiastic and informative",
        include_sponsor_mention=True
    )
    
    print(f"\n[INPUT] Generating script for:")
    print(f"  - Topic: {request.topic}")
    print(f"  - Brand: {request.brand_name}")
    print(f"  - Duration: {request.duration_seconds}s")
    print(f"  - Tone: {request.tone}")
    print(f"  - Target: {request.target_audience}")
    
    print("\n" + "-"*70)
    print("Calling Groq AI...")
    print("-"*70)
    
    # Generate script
    mock_user = MockUser()
    response = await generate_video_script(request, mock_user)
    
    if not response.success:
        print(f"\n[FAIL] {response.error}")
        return False
    
    # Display results
    print("\n" + "="*70)
    print(" GENERATED VIDEO SCRIPT")
    print("="*70)
    
    print(f"\n📹 TITLE: {response.title}")
    print(f"\n📝 DESCRIPTION:")
    print(f"   {response.description}")
    print(f"\n⏱️  TOTAL DURATION: {response.total_duration} seconds")
    print(f"\n🎬 SCENES: {len(response.scenes)}")
    
    for scene in response.scenes:
        print(f"\n{'─'*70}")
        print(f"Scene {scene.scene_number} ({scene.duration_seconds}s)")
        print(f"{'─'*70}")
        print(f"\n🎥 VISUAL:")
        print(f"   {scene.visual_description}")
        print(f"\n💬 DIALOGUE:")
        print(f"   {scene.dialogue}")
        if scene.camera_notes:
            print(f"\n📷 CAMERA:")
            print(f"   {scene.camera_notes}")
    
    if response.production_notes:
        print(f"\n{'═'*70}")
        print("📋 PRODUCTION NOTES:")
        print(f"{'═'*70}")
        print(f"{response.production_notes}")
    
    print(f"\n{'='*70}")
    print(" TEST PASSED - VIDEO SCRIPT GENERATED SUCCESSFULLY!")
    print(f"{'='*70}")
    print(f"\n✅ Created {len(response.scenes)} scenes")
    print(f"✅ Total duration: {response.total_duration}s")
    print(f"✅ Professional script ready for production!")
    
    # Save script to file
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'video_scripts')
    os.makedirs(output_dir, exist_ok=True)
    
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"script_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w') as f:
        json.dump(response.dict(), f, indent=2)
    
    print(f"\n💾 Script saved to: {filepath}")
    
    return True


async def main():
    result = await test_video_script_generation()
    
    if result:
        print("\n🎉 Video Script Generation is READY TO USE!")
    else:
        print("\n❌ Test failed - check configuration")


if __name__ == "__main__":
    asyncio.run(main())
