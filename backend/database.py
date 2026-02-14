from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 数据库URL：SQLite文件存储在项目根目录
SQLALCHEMY_DATABASE_URL = "sqlite:///./growth.db"

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},  # 仅SQLite需要
    echo=True  # 加上这一行
)

# 创建会话本地类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 所有ORM模型的基类
Base = declarative_base()