import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 加载 backend/.env（已存在的环境变量优先，不会覆盖平台注入的配置）
load_dotenv()

# 数据库URL：SQLite文件存储在项目根目录
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./growth.db")

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},  # 仅SQLite需要
)

# 创建会话本地类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 所有ORM模型的基类
Base = declarative_base()


from sqlalchemy.orm import Session

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
