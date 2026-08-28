from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

import auth
import ai
import models
import schemas
from database import get_db

# 建表/改表统一走 alembic（Procfile 启动时先 alembic upgrade head 再起服务）。
# 不再用 create_all：它只会建缺失的表、不会加新列，线上老库会和新模型对不上。

app = FastAPI(title="成长图谱API")

# 配置CORS
origins = [
    "http://localhost:5173",      # Vite 默认开发服务器
    "http://127.0.0.1:5173",
    "http://localhost:3000",      # 本项目 vite.config.js 实际使用的端口
    "http://127.0.0.1:3000",
    "https://growth-map.vercel.app",  # 已部署的前端
    "https://growth-map-production.up.railway.app" #线上部署
    # 如果需要，可以添加更多
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],     # 允许所有HTTP方法
    allow_headers=["*"],     # 允许所有请求头
)

# ---------- 健康检查 ----------
@app.get("/")
def root():
    return {"message": "成长图谱后端已启动"}

# ---------- 成就CRUD ----------
@app.post("/achievements", 
          response_model=schemas.Achievement,
          summary="创建成就",
          description="创建一个新的成就记录，需要提供标题、目标值、分类等",
          tags=["成就管理"])
def create_achievement(
    achievement: schemas.AchievementCreate, 
    db: Session = Depends(get_db),
    current_user:models.User =Depends(auth.get_current_user)
):
    """创建新成就（kind=card 普通卡 / milestone 里程碑 / task 任务卡）"""
    # 树结构校验：有父节点时，父必须存在且属于当前用户（防止把卡挂到别人的树上）
    parent = None
    if achievement.parent_id is not None:
        parent = db.query(models.Achievement).filter(
            models.Achievement.id == achievement.parent_id,
            models.Achievement.user_id == current_user.id,
        ).first()
        if parent is None:
            raise HTTPException(status_code=400, detail="父节点不存在或不属于当前用户")

    db_achievement = models.Achievement(**achievement.dict(), user_id=current_user.id)
    # root_id 归属：子节点继承父的 root；无父的里程碑自己是树根（插入拿到 id 后回填）
    if parent is not None:
        db_achievement.root_id = parent.root_id or parent.id
    db.add(db_achievement)
    db.flush()
    if parent is None and db_achievement.kind == "milestone":
        db_achievement.root_id = db_achievement.id
    db.commit()
    db.refresh(db_achievement)
    return db_achievement


@app.get("/achievements", 
         response_model=list[schemas.Achievement],
         summary="获取成就列表",
         description="支持分页和按分类过滤",
         tags=["成就管理"])
def read_achievements(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # 只返回当前登录用户自己的成就（用户隔离，避免串号）
    query = db.query(models.Achievement).filter(models.Achievement.user_id == current_user.id)

    if category:
        query = query.filter(models.Achievement.category == category)

    achievements = (
        query.order_by(models.Achievement.created_at.desc(), models.Achievement.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return achievements

@app.put("/achievements/{achievement_id}", response_model=schemas.Achievement)
def update_achievement(
    achievement_id: int,
    achievement: schemas.AchievementUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """更新成就（全量/部分）"""
    # 只能修改自己名下的成就
    db_achievement = db.query(models.Achievement).filter(
        models.Achievement.id == achievement_id,
        models.Achievement.user_id == current_user.id
    ).first()
    if db_achievement is None:
        raise HTTPException(status_code=404, detail="成就不存在")
    
    # 仅更新传入的字段（exclude_unset=True）
    update_data = achievement.dict(exclude_unset=True)

    # 跨字段校验：schema 校验只看 payload 内部，只传 current/target 之一时
    # 要对照数据库里的另一个字段，防止把进度改超目标（或把目标改到进度之下）
    if "current_value" in update_data or "target_value" in update_data:
        effective_target = update_data.get("target_value", db_achievement.target_value)
        effective_current = update_data.get("current_value", db_achievement.current_value)
        if effective_current > effective_target:
            raise HTTPException(
                status_code=422,
                detail=f"当前值（{effective_current}）不能超过目标值（{effective_target}）",
            )

    # 移动节点：换父时校验新父归属，并同步重算 root_id（树根冗余列不能失真）
    if "parent_id" in update_data:
        new_parent_id = update_data["parent_id"]
        if new_parent_id is None:
            db_achievement.root_id = None
        else:
            new_parent = db.query(models.Achievement).filter(
                models.Achievement.id == new_parent_id,
                models.Achievement.user_id == current_user.id,
            ).first()
            if new_parent is None:
                raise HTTPException(status_code=400, detail="新的父节点不存在或不属于当前用户")
            if new_parent.id == db_achievement.id:
                raise HTTPException(status_code=400, detail="不能把自己挂到自己下面")
            # 防循环：新父若是自己的后代，沿 parent 链往上会遇到自己
            node = new_parent
            while node is not None:
                if node.id == db_achievement.id:
                    raise HTTPException(status_code=400, detail="不能把节点挂到它自己的子树下")
                node = db.query(models.Achievement).filter(
                    models.Achievement.id == node.parent_id
                ).first()
            db_achievement.root_id = new_parent.root_id or new_parent.id

    for key, value in update_data.items():
        setattr(db_achievement, key, value)
    
    db.commit()
    db.refresh(db_achievement)
    return db_achievement

@app.delete("/achievements/{achievement_id}")
def delete_achievement(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user:models.User=Depends(auth.get_current_user)
):
    """删除成就"""
    db_achievement = db.query(models.Achievement).filter(
        models.Achievement.id == achievement_id,
        models.Achievement.user_id == current_user.id
    ).first()
    if db_achievement is None:
        raise HTTPException(status_code=404, detail="成就不存在")

    # 树守卫：还有子节点时不许删，避免一删带走一整棵子树
    child_count = db.query(models.Achievement).filter(
        models.Achievement.parent_id == achievement_id
    ).count()
    if child_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"该节点下还有 {child_count} 个子节点，请先删除子节点",
        )

    db.delete(db_achievement)
    db.commit()
    return {"message": "删除成功"}

@app.get("/achievements/stats/by_category")
def get_category_stats(db: Session = Depends(get_db),
                       current_user:models.User=Depends(auth.get_current_user)):
    """统计每个类别的成就数量、平均进度等"""
    # 只统计当前登录用户自己的成就（与列表接口一致，避免跨用户数据泄露）
    # 且只认 kind=card 的真实成就卡——里程碑是派生节点、任务是待办，都不进统计
    stats = db.query(
        models.Achievement.category,
        func.count(models.Achievement.id).label('count'),
        func.avg(models.Achievement.current_value * 1.0 / models.Achievement.target_value).label('avg_progress')
    ).filter(
        models.Achievement.user_id == current_user.id,
        models.Achievement.kind == "card",
    ).group_by(models.Achievement.category).all()
    
    return [
        {
            "category": cat,
            "count": count,
            "avg_progress": float(avg) if avg else 0
        }
        for cat, count, avg in stats
    ]

@app.get("/achievements/stats/overall", tags=["统计"])
def get_overall_stats(db: Session = Depends(get_db),
                      current_user:models.User=Depends(auth.get_current_user)
                      ):
    """总体统计：总数、已完成数、总进度等"""
    # 只统计当前登录用户自己的成就，且只认真实成就卡（同 by_category 的口径）
    mine = db.query(models.Achievement).filter(
        models.Achievement.user_id == current_user.id,
        models.Achievement.kind == "card",
    )
    total = mine.count()
    completed = mine.filter(
        models.Achievement.current_value >= models.Achievement.target_value
    ).count()

    # 总进度（所有成就的当前值之和 / 目标值之和）
    total_current = mine.with_entities(func.sum(models.Achievement.current_value)).scalar() or 0
    total_target = mine.with_entities(func.sum(models.Achievement.target_value)).scalar() or 1  # 避免除零
    overall_progress = total_current / total_target if total_target > 0 else 0
    
    return {
        "total_achievements": total,
        "completed_achievements": completed,
        "overall_progress": overall_progress
    }

# ---------- AI 推演（只建议、不落库；预览确认后由前端走正常创建接口） ----------
@app.post("/trees/infer", response_model=schemas.InferResponse, tags=["技能树"])
def infer_skill_tree(
    req: schemas.InferRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """AI 推演技能树：achievement_id=种子卡（推演出候选树）；root_id=已有树根（推演补全子卡）"""
    if (req.achievement_id is None) == (req.root_id is None):
        raise HTTPException(status_code=400, detail="achievement_id 与 root_id 必须二选一")

    if req.achievement_id is not None:
        seed = db.query(models.Achievement).filter(
            models.Achievement.id == req.achievement_id,
            models.Achievement.user_id == current_user.id,
        ).first()
        if seed is None:
            raise HTTPException(status_code=404, detail="种子卡不存在")
        result = ai.infer_from_seed(seed.title, seed.category)
        result["mode"] = "seed"
    else:
        root = db.query(models.Achievement).filter(
            models.Achievement.id == req.root_id,
            models.Achievement.user_id == current_user.id,
            models.Achievement.kind == "milestone",
        ).first()
        if root is None:
            raise HTTPException(status_code=404, detail="树不存在")
        children = db.query(models.Achievement).filter(
            models.Achievement.parent_id == root.id
        ).all()
        result = ai.infer_for_tree(root.title, [c.title for c in children])
        result["mode"] = "expand"
    return result

# 自定义全局异常处理器
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "message": exc.detail,
            "success": False
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # 处理未捕获的异常（生产环境应记录日志）
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": "服务器内部错误",
            "success": False
        }
    )

# ---------- 认证路由 ----------
@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 检查用户名是否已被占用
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已被注册")
    
    # 创建新用户（密码加密）
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
