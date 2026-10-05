# backend/api/index.py
# Vercel Python Serverless 入口：把 FastAPI 应用暴露给 @vercel/python（原生支持 ASGI 的 `app` 变量）。
# 所有路径经 vercel.json 的 routes 重写到这一份函数。
# 注意：不要把这里的 import 包进 try/except——Vercel 构建时靠静态分析找 app 变量，包起来会构建失败。
from main import app
