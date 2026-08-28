from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
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
    # 技能树（森林模式）：card 普通成就卡 / milestone 里程碑（树根或汇聚节点）/ task 任务卡
    kind = Column(String(20), default="card", nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("achievements.id"), nullable=True)
    # 树根 id 的冗余列：沿 parent 链取整棵树要递归，root_id 让"取一棵树"一次查询搞定
    root_id = Column(Integer, ForeignKey("achievements.id"), nullable=True, index=True)
    image_url = Column(String(500), nullable=True)
    # 难度评级 A/B/C：AI 推演时给建议值，最终由用户选择确认（奖杯边框按它定级）
    difficulty = Column(String(1), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 外键：指向用户表
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 关联关系
    owner = relationship("User", back_populates="achievements")