# backend/api/index.py
# Vercel Python Serverless 入口：把 FastAPI 应用暴露给 @vercel/python（原生支持 ASGI 的 `app` 变量）。
# 所有路径经 vercel.json 的 routes 重写到这一份函数。
try:
    from main import app  # Vercel 识别名为 app 的 ASGI 应用
except Exception as e:
    # 临时诊断补丁：启动即崩溃时把原因直接显示出来（定位后删除此段）
    import traceback

    from fastapi import FastAPI

    _debug = FastAPI(title="启动失败诊断")

    @_debug.get("/{_p:path}")
    def _show_error(_p: str = ""):
        return {
            "import_error": repr(e),
            "traceback_tail": traceback.format_exc()[-1200:],
        }

    app = _debug
