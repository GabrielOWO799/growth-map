from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, validator

class AchievementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="成就标题，1-100字符")
    description: Optional[str] = Field(None, max_length=500, description="描述，最多500字符")
    target_value: int = Field(..., gt=0, le=10000, description="目标值，1-10000")
    current_value: int = Field(0, ge=0, description="当前值，不能小于0")
    category: str = Field(..., min_length=1, max_length=50, description="分类")
    due_date: Optional[date] = None
    # 技能树字段：kind 三类节点；parent_id 挂到父节点；image_url 卡面图（可选）
    kind: Literal["card", "milestone", "task"] = Field("card", description="节点类型：card/milestone/task")
    parent_id: Optional[int] = Field(None, description="父节点 id（构成树）")
    image_url: Optional[str] = Field(None, max_length=500, description="卡面图片 URL")
    difficulty: Optional[Literal["A", "B", "C"]] = Field(None, description="难度评级（AI 建议、用户终选）")

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
    due_date: Optional[date] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = Field(None, max_length=500)
    difficulty: Optional[Literal["A", "B", "C"]] = None
    # 注意：kind 不开放更新——把里程碑改成普通卡会留下悬挂的子节点引用

    @validator('current_value')
    def current_not_exceed_target(cls, v, values):
        # 更新时可能只传了current_value没传target_value，需要判断
        if v is not None and 'target_value' in values and values['target_value'] is not None:
            if v > values['target_value']:
                raise ValueError('当前值不能超过目标值')
        return v
    
# 响应模型：独立定义，不继承 AchievementCreate 的校验器。
# 响应模型若继承输入校验（current ≤ target 等），库里一旦存在违反不变量的
# 历史数据，列表/更新等任何读接口都会因响应校验失败而整体 500。
class Achievement(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    target_value: int
    current_value: int
    category: str
    due_date: Optional[date] = None
    kind: str = "card"
    parent_id: Optional[int] = None
    root_id: Optional[int] = None
    image_url: Optional[str] = None
    difficulty: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

#day11
# 新增用户相关模型
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, description="用户名")
    password: str = Field(..., min_length=6, max_length=50, description="密码（6-50字符）")

class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

# ---------- AI 推演（/trees/infer 的请求/响应） ----------
class InferRequest(BaseModel):
    achievement_id: Optional[int] = Field(None, description="种子卡 id：散卡推演成候选树")
    root_id: Optional[int] = Field(None, description="树根里程碑 id：给已有树推演补全子卡")
    # 两者必须二选一，由接口校验

class InferSuggestion(BaseModel):
    title: str
    difficulty: str = "B"
    reason: str = ""

class InferResponse(BaseModel):
    mode: str  # 'seed' 散卡推演 | 'expand' 已有树补全
    milestone_title: Optional[str] = None  # 仅 seed 模式返回
    suggestions: List[InferSuggestion] = []