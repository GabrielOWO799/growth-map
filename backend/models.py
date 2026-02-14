from sqlalchemy import Column, Integer, String, Text
from database import Base

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    target_value = Column(Integer, nullable=False)
    current_value = Column(Integer, default=0, nullable=False)
    category = Column(String, index=True, nullable=False)  # 添加索引