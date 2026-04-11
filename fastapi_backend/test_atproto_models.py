import asyncio
from atproto import Client, models
import inspect

def inspect_models():
    print("Inspecting atproto models...")
    
    # Check for BlobRef
    if hasattr(models, 'BlobRef'):
        print("Found models.BlobRef")
    else:
        print("models.BlobRef NOT found")
        
    # Check for ComAtprotoRepoStrongRef
    if hasattr(models, 'ComAtprotoRepoStrongRef'):
        print("Found models.ComAtprotoRepoStrongRef")
        
    # Check structure of Blob
    print("\nListing available models starting with Blob:")
    for name, obj in inspect.getmembers(models):
        if 'Blob' in name:
            print(f"- {name}")

if __name__ == "__main__":
    inspect_models()
