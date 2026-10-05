# backend/api/index.py
# Vercel Python Serverless 入口：把 FastAPI 应用暴露给 @vercel/python（原生支持 ASGI 的 `app` 变量）。
# 所有路径经 vercel.json 的 routes 重写到这一份函数。
from main import app  # noqa: F401 —— Vercel 识别名为 app 的 ASGI 应用
