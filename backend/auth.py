from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from database import get_db
from models import User
import os
import warnings

# 1. 密码加密上下文
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# 2. JWT 配置
# SECRET_KEY 必须来自环境变量（本地放 .env，线上用平台的环境变量配置）。
# 历史教训：曾在缺省时回退到代码里写死的密钥，等于任何人都能伪造 token，
# 所以现在改为：DEBUG 模式（本地开发）给临时密钥并大声警告；非 DEBUG 环境直接拒绝启动。
load_dotenv()

_DEV_SECRET_KEY = "dev-only-insecure-secret-key"

def _is_debug() -> bool:
    return os.getenv("DEBUG", "").strip().lower() in ("1", "true", "yes", "on")

def _load_secret_key() -> str:
    key = os.getenv("SECRET_KEY", "").strip()
    if key:
        return key
    if _is_debug():
        warnings.warn(
            "SECRET_KEY 未设置，正在使用仅供本地开发的临时密钥。"
            "请在 .env 或环境变量中配置 SECRET_KEY（可用 python -c \"import secrets; print(secrets.token_hex(32))\" 生成）。"
        )
        return _DEV_SECRET_KEY
    raise RuntimeError(
        "SECRET_KEY 未设置：生产环境必须通过环境变量配置随机 SECRET_KEY，拒绝启动。"
    )

SECRET_KEY = _load_secret_key()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 3. OAuth2 密码流（用于 Swagger 自动文档登录）
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ----- 工具函数 -----
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ----- 依赖项：获取当前登录用户 -----
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="认证凭证无效或已过期",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

