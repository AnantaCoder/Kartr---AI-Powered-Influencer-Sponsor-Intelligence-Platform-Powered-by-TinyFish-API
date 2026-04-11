import os
from dotenv import load_dotenv, dotenv_values

print("--- Dotenv Values ---")
values = dotenv_values(".env")
for k, v in values.items():
    print(f"Key: {repr(k)}, Value: {repr(v)}")

print("\n--- Testing load_dotenv ---")
try:
    load_dotenv()
    print("load_dotenv successful")
except Exception as e:
    print(f"load_dotenv failed: {e}")
