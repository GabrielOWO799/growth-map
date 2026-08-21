from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

from fastapi import Depends

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm  # 新增
from sqlalchemy.orm import Session
from datetime import timedelta
import models, schemas, auth  # 导入 auth 模块
from database import SessionLocal, engine


# 创建数据库表（如果不存在）
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="成长图谱API")

# 配置CORS
origins = [
    "http://localhost:5173",      # Vite 默认开发服务器
    "http://127.0.0.1:5173",
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

# ---------- 依赖项：获取数据库会话 ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    """创建新成就"""
    db_achievement = models.Achievement(**achievement.dict(),user_id=current_user.id)
    db.add(db_achievement)
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

    achievements = query.offset(skip).limit(limit).all()
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
    
    db.delete(db_achievement)
    db.commit()
    return {"message": "删除成功"}

@app.get("/achievements/stats/by_category")
def get_category_stats(db: Session = Depends(get_db),
                       current_user:models.User=Depends(auth.get_current_user)):
    """统计每个类别的成就数量、平均进度等"""
    stats = db.query(
        models.Achievement.category,
        func.count(models.Achievement.id).label('count'),
        func.avg(models.Achievement.current_value * 1.0 / models.Achievement.target_value).label('avg_progress')
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
    total = db.query(models.Achievement).count()
    completed = db.query(models.Achievement).filter(
        models.Achievement.current_value >= models.Achievement.target_value
    ).count()
    
    # 总进度（所有成就的当前值之和 / 目标值之和）
    total_current = db.query(func.sum(models.Achievement.current_value)).scalar() or 0
    total_target = db.query(func.sum(models.Achievement.target_value)).scalar() or 1  # 避免除零
    overall_progress = total_current / total_target if total_target > 0 else 0
    
    return {
        "total_achievements": total,
        "completed_achievements": completed,
        "overall_progress": overall_progress
    }

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
