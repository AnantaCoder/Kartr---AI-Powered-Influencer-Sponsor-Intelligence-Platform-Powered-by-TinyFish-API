print("Importing logging...")
import logging
print("Importing os, sys...")
import os
import sys
print("Importing fastapi...")
from fastapi import FastAPI
print("Importing routers...")
try:
    print("Importing auth_router...")
    from routers.auth import router as auth_router
    print("Importing youtube_router...")
    from routers.youtube import router as youtube_router
    print("All routers imported!")
except Exception as e:
    print(f"Error importing routers: {e}")
    import traceback
    traceback.print_exc()
print("End of test")
