from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_root():
    """测试根路径"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "成长图谱后端已启动"}

def test_create_achievement():
    """测试创建成就"""
    response = client.post("/achievements", json={
        "title": "测试成就",
        "target_value": 10,
        "category": "测试"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "测试成就"
    assert "id" in data
    assert data["current_value"] == 0

def test_create_achievement_invalid():
    """测试创建成就时的验证错误"""
    # 空标题
    response = client.post("/achievements", json={
        "title": "   ",
        "target_value": 10,
        "category": "测试"
    })
    assert response.status_code == 422  # 验证错误

    # 负目标值
    response = client.post("/achievements", json={
        "title": "有效标题",
        "target_value": -5,
        "category": "测试"
    })
    assert response.status_code == 422

def test_get_achievements():
    """测试获取列表（先创建后获取）"""
    # 先创建一条
    client.post("/achievements", json={
        "title": "列表测试",
        "target_value": 5,
        "category": "测试"
    })
    response = client.get("/achievements")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_get_achievement_by_id():
    """测试获取单个成就"""
    # 创建一条
    resp = client.post("/achievements", json={
        "title": "单个测试",
        "target_value": 3,
        "category": "测试"
    })
    created = resp.json()
    aid = created["id"]
    
    # 获取
    response = client.get(f"/achievements/{aid}")
    assert response.status_code == 200
    assert response.json()["id"] == aid

def test_get_achievement_not_found():
    """测试获取不存在的成就"""
    response = client.get("/achievements/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "成就不存在"

def test_update_achievement():
    """测试更新成就"""
    # 创建
    resp = client.post("/achievements", json={
        "title": "更新前",
        "target_value": 10,
        "current_value": 2,
        "category": "测试"
    })
    created = resp.json()
    aid = created["id"]
    
    # 更新
    response = client.put(f"/achievements/{aid}", json={
        "title": "更新后",
        "current_value": 5
    })
    assert response.status_code == 200
    updated = response.json()
    assert updated["title"] == "更新后"
    assert updated["current_value"] == 5
    assert updated["target_value"] == 10  # 未变

def test_delete_achievement():
    """测试删除成就"""
    # 创建
    resp = client.post("/achievements", json={
        "title": "待删除",
        "target_value": 1,
        "category": "测试"
    })
    aid = resp.json()["id"]
    
    # 删除
    response = client.delete(f"/achievements/{aid}")
    assert response.status_code == 200
    assert response.json()["message"] == "删除成功"
    
    # 确认已删除
    response = client.get(f"/achievements/{aid}")
    assert response.status_code == 404

def test_stats_by_category():
    """测试按类别统计"""
    # 清理或确保数据存在？最好用独立测试数据库，但这里简单测试
    # 创建一些数据
    client.post("/achievements", json={
        "title": "统计A1",
        "target_value": 10,
        "current_value": 5,
        "category": "统计类"
    })
    client.post("/achievements", json={
        "title": "统计A2",
        "target_value": 20,
        "current_value": 10,
        "category": "统计类"
    })
    response = client.get("/achievements/stats/by_category")
    assert response.status_code == 200
    data = response.json()
    # 找到"统计类"并验证
    stat = next((s for s in data if s["category"] == "统计类"), None)
    assert stat is not None
    assert stat["count"] >= 2
    # 平均进度应为 (5/10 + 10/20)/2 = (0.5+0.5)/2 = 0.5
    assert stat["avg_progress"] == 0.5

def test_stats_overall():
    """测试总体统计"""
    response = client.get("/achievements/stats/overall")
    assert response.status_code == 200
    data = response.json()
    assert "total_achievements" in data
    assert "completed_achievements" in data
    assert "overall_progress" in data