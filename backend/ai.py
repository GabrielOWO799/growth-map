# backend/ai.py
# AI 推演（知识结构顾问）：给定一张种子卡或一棵已有树，让 DeepSeek 推演
# 相邻的未完成节点和汇聚里程碑。
# 设计约定：AI 只出建议、绝不直接落库；前端预览、用户增删改确认后才创建。
import json
import os

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()  # 读取 backend/.env（已有环境变量优先，不影响平台注入的配置）

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

VALID_DIFFICULTIES = ("A", "B", "C")

# 难度口径（与产品约定一致）：A=大目标 B=中等 C=轻量
_SEED_PROMPT = """\
你是个人成长地图的"知识结构顾问"。用户刚完成了一张成就卡：
标题：{title}（分类：{category}）
请从知识/技能结构出发推演：
1. milestone_title：这张卡最终汇聚成的关键里程碑（如"学完 Python 容器"），措辞简洁、可判定完成；
2. suggestions：3~5 个与种子卡粒度相近、用户尚未完成的"相邻节点"卡片标题。
难度口径：A=大目标（数周以上，如学完一个领域） B=中等（数天到两周，如读完一本书） C=轻量（数小时到数天）。
严格只输出 JSON：
{{"milestone_title": "...", "suggestions": [{{"title": "...", "difficulty": "A|B|C", "reason": "一句话理由"}}]}}\
"""

_EXPAND_PROMPT = """\
你是个人成长地图的"知识结构顾问"。用户有一棵技能树：
树根里程碑：{root_title}
已有子卡：{children}
请推演 3~5 个**当前列表里没有**的补充子卡（粒度与已有子卡相近，不重复、不空泛）。
难度口径：A=大目标（数周以上） B=中等（数天到两周） C=轻量（数小时到数天）。
严格只输出 JSON：
{{"suggestions": [{{"title": "...", "difficulty": "A|B|C", "reason": "一句话理由"}}]}}\
"""


def _chat_json(prompt: str) -> dict:
    """调 DeepSeek 拿 JSON 输出；网络/鉴权/格式问题统一转成用户可读的 HTTPException"""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="服务器未配置 DEEPSEEK_API_KEY，无法推演")
    try:
        resp = httpx.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.5,
            },
            timeout=60.0,
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="推演服务暂时不可用，请稍后重试")
    if resp.status_code == 401:
        raise HTTPException(status_code=502, detail="DEEPSEEK_API_KEY 无效，请检查后端 .env")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"推演服务返回 {resp.status_code}，请稍后重试")
    try:
        return json.loads(resp.json()["choices"][0]["message"]["content"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(status_code=502, detail="推演结果解析失败，请重试一次")


def _clean_suggestions(raw) -> list[dict]:
    """防御性清洗：标题去空去重、难度收敛到 A/B/C，坏行直接丢弃"""
    seen, result = set(), []
    for item in raw or []:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        if not title or title in seen:
            continue
        seen.add(title)
        difficulty = str(item.get("difficulty") or "").strip().upper()
        result.append({
            "title": title[:100],
            "difficulty": difficulty if difficulty in VALID_DIFFICULTIES else "B",
            "reason": str(item.get("reason") or "").strip()[:200],
        })
    return result


def infer_from_seed(title: str, category: str) -> dict:
    """散卡 -> 候选树：推演汇聚里程碑 + 相邻未完成卡"""
    data = _chat_json(_SEED_PROMPT.format(title=title, category=category))
    milestone = str(data.get("milestone_title") or "").strip()[:100]
    return {"milestone_title": milestone, "suggestions": _clean_suggestions(data.get("suggestions"))}


def infer_for_tree(root_title: str, child_titles: list) -> dict:
    """已有树 -> 补全建议：只补充当前不存在的子卡"""
    existing = "、".join(child_titles) if child_titles else "（还没有子卡）"
    data = _chat_json(_EXPAND_PROMPT.format(root_title=root_title, children=existing))
    suggestions = _clean_suggestions(data.get("suggestions"))
    # 提示词已要求不与已有子卡重复，但 LLM 不保证听话——这里兜底过滤
    existing_set = {t.strip() for t in child_titles}
    return {
        "milestone_title": None,
        "suggestions": [s for s in suggestions if s["title"] not in existing_set],
    }
