from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
import os
print("Current working directory:", os.getcwd())
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY", "your-secret-key-here")  # 从环境变量读取
API_KEY_NAME = "X-API-Key"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)



async def verify_api_key(api_key: str = Security(api_key_header)):
    print("=== verify_api_key 被调用 ===")
    print(f"Received api_key: {api_key}")
    print(f"Expected API_KEY: {API_KEY}")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="缺少API Key"
        )
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无效的API Key"
        )
    return api_key

print(f"API_KEY from env: {API_KEY}")

# API_KEY = os.getenv("API_KEY", "your-secret-key-here")
API_KEY = "test123"   # 临时硬编码