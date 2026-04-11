from atproto import models
import inspect

def inspect_video_model():
    print("Inspecting models.AppBskyEmbedVideo.Main...")
    try:
        model = models.AppBskyEmbedVideo.Main
        print(f"Model: {model}")
        # Print fields or type annotations if available
        if hasattr(model, 'model_fields'):
             print("Fields:", model.model_fields)
        elif hasattr(model, '__annotations__'):
             print("Annotations:", model.__annotations__)
             
        # Also try to print dir(models) to find blob related classes
        print("\nSearching for Blob in models:")
        for name in dir(models):
            if 'Blob' in name:
                print(f"- {name}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_video_model()
