from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

from auth import verify_api_key
from fastapi import Depends

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
):
    """创建新成就"""
    db_achievement = models.Achievement(**achievement.dict())
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
    api_key: str = Depends(verify_api_key)   # 添加这一行
):
    print(f"接收到的 category: {category}")  # 调试输出
    
    query = db.query(models.Achievement)
    if category:
        print(f"正在过滤 category = {category}")
        query = query.filter(models.Achievement.category == category)
    
    # 打印最终生成的 SQL 语句（但不会显示参数值）
    print(query)
    
    achievements = query.offset(skip).limit(limit).all()
    return achievements

@app.put("/achievements/{achievement_id}", response_model=schemas.Achievement)
def update_achievement(
    achievement_id: int,
    achievement: schemas.AchievementUpdate,
    db: Session = Depends(get_db)
):
    """更新成就（全量/部分）"""
    db_achievement = db.query(models.Achievement).filter(
        models.Achievement.id == achievement_id
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
    db: Session = Depends(get_db)
):
    """删除成就"""
    db_achievement = db.query(models.Achievement).filter(
        models.Achievement.id == achievement_id
    ).first()
    if db_achievement is None:
        raise HTTPException(status_code=404, detail="成就不存在")
    
    db.delete(db_achievement)
    db.commit()
    return {"message": "删除成功"}

@app.get("/achievements/stats/by_category")
def get_category_stats(db: Session = Depends(get_db)):
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
def get_overall_stats(db: Session = Depends(get_db)):
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

