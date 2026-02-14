from pydantic import BaseModel
from typing import Optional, List  # 加上 List
from pydantic import BaseModel, validator, Field
from typing import Optional

class AchievementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="成就标题，1-100字符")
    description: Optional[str] = Field(None, max_length=500, description="描述，最多500字符")
    target_value: int = Field(..., gt=0, le=10000, description="目标值，1-10000")
    current_value: int = Field(0, ge=0, description="当前值，不能小于0")
    category: str = Field(..., min_length=1, max_length=50, description="分类")

    @validator('current_value')
    def current_not_exceed_target(cls, v, values):
        """确保当前值不超过目标值"""
        if 'target_value' in values and v > values['target_value']:
            raise ValueError('当前值不能超过目标值')
        return v

    @validator('title')
    def title_not_empty(cls, v):
        """确保标题不为空字符串或仅空格"""
        if not v or v.strip() == '':
            raise ValueError('标题不能为空')
        return v.strip()

class AchievementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100,description="成就标题")
    description: Optional[str] = Field(None, max_length=500)
    target_value: Optional[int] = Field(None, gt=0, le=10000)
    current_value: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, min_length=1, max_length=50)

    @validator('current_value')
    def current_not_exceed_target(cls, v, values):
        # 更新时可能只传了current_value没传target_value，需要判断
        if v is not None and 'target_value' in values and values['target_value'] is not None:
            if v > values['target_value']:
                raise ValueError('当前值不能超过目标值')
        return v
    
class Achievement(AchievementCreate):
    id: int

    class Config:
        from_attributes = True