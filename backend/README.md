# 成长图谱后端 - 开发日志

## Day 1 (2024-02-13)
- Python版本: 3.12.x
- FastAPI版本: 0.115.x
- 虚拟环境路径: ./venv
- 开发服务器运行正常
- 测试接口:
  - GET / → OK
  - GET /achievements → OK
  - /docs → OK
## Day 2 (2024-02-14)
- 完成内存版CRUD接口开发
- 掌握路径参数、查询参数、请求体、Pydantic模型
- 已实现：
  - GET /achievements (支持分页)
  - GET /achievements/{id}
  - POST /achievements
  - PUT /achievements/{id}
  - DELETE /achievements/{id}
- 内存存储测试通过，重启后数据会丢失（明天解决）

## Day 3 (2024-02-14)
- 集成SQLite + SQLAlchemy
- 完成数据库持久化CRUD
- 项目结构优化：
  - database.py：数据库连接
  - models.py：ORM模型
  - schemas.py：Pydantic模型
  - main.py：精简后的应用入口
- 所有接口已切换到真实数据库
- 测试通过，重启数据不丢失

## Day 4 (2024-02-15)
- 增强Pydantic模型验证（标题非空、current ≤ target）
- 添加CORS中间件，允许前端开发服务器访问
- 实现高级查询：
  - 按类别过滤
  - 按类别统计成就数量和平均进度
  - 总体统计（总数、完成数、总进度）
- 所有接口通过Swagger测试

## 部署环境变量（Vercel / 任意平台）

以下变量在平台的环境变量里配置，不要写进代码或提交到 git（本地开发写 `backend/.env`，已被 .gitignore 忽略）：

| 变量 | 必填 | 说明 |
|---|---|---|
| `SECRET_KEY` | 生产必填 | JWT 签名密钥。生成方式：`python -c "import secrets; print(secrets.token_hex(32))"`。未设置时：DEBUG 模式给临时密钥并警告，非 DEBUG 直接拒绝启动 |
| `DATABASE_URL` | 生产必填 | Postgres 连接串（如 Neon 免费库，建议用 Pooled 连接）。`postgres://` 开头会自动归一化，驱动用 psycopg3 |
| `DEEPSEEK_API_KEY` | 推演功能必填 | DeepSeek API 密钥（`sk-` 开头），用于技能树 AI 推演。未配置时推演接口返回 503，其余功能不受影响 |
| `DEBUG` | 可选 | 本地开发设 `True`；生产保持未设置或 `false` |

## 免费部署方案：Vercel Serverless + Neon Postgres（当前采用）

- **后端**：Vercel Python Serverless（Hobby 免费档，无需银行卡）。`backend/api/index.py` 是入口，`backend/vercel.json` 配置路由与 60s 超时（AI 推演需要）。导入仓库时 Root Directory 设为 `backend`
- **数据库**：Neon 免费 Postgres（0.5GB，不过期，无需银行卡）。Serverless 平台的磁盘都是临时的，数据必须放外部数据库
- **建表**：Serverless 没有迁移环节，冷启动时幂等 `create_all` 兜底（只补缺失的表）；生产库的结构变更用 alembic 从本地执行：`DATABASE_URL=<Neon连接串> python -m alembic upgrade head`
- 本地开发不受影响：默认仍走 SQLite（`backend/.env`）