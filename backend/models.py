from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(Date, default=datetime.utcnow)

    # 关联关系：一个用户拥有多个成就
    achievements = relationship("Achievement", back_populates="owner")

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=True)
    target_value = Column(Integer, nullable=False)
    current_value = Column(Integer, default=0)
    category = Column(String(50), index=True, nullable=False)
    due_date = Column(Date, nullable=True)
    created_at = Column(Date, default=datetime.utcnow)

    # 外键：指向用户表
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 关联关系
    owner = relationship("User", back_populates="achievements")