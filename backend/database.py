import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 加载 backend/.env（已存在的环境变量优先，不会覆盖平台注入的配置）
load_dotenv()

# 数据库URL：本地默认 SQLite；线上通过 DATABASE_URL 指向托管 Postgres（如 Neon）
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./growth.db")

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    # 部分平台发的旧协议头，SQLAlchemy 2.0 只认 postgresql://
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Postgres：用 psycopg3 驱动；pool_pre_ping 防止 Neon 休眠回收连接后第一次查询报错
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
else:
    # SQLite 仅需要的参数
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
