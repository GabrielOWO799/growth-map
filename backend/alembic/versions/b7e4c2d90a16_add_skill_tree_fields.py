"""add skill tree fields and image_url, created_at to datetime

Revision ID: b7e4c2d90a16
Revises: 96312e3b46ae
Create Date: 2026-08-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e4c2d90a16'
down_revision: Union[str, Sequence[str], None] = '96312e3b46ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1) 技能树四列 + 卡面图（batch 模式：SQLite 的 ALTER 靠重建整表实现）
    with op.batch_alter_table("achievements") as batch:
        batch.add_column(sa.Column("kind", sa.String(length=20), nullable=True))
        batch.add_column(sa.Column("parent_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("root_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("image_url", sa.String(length=500), nullable=True))
        batch.create_foreign_key("fk_achievements_parent_id", "achievements", ["parent_id"], ["id"])
        batch.create_foreign_key("fk_achievements_root_id", "achievements", ["root_id"], ["id"])
    # 老数据全部回落为普通成就卡
    op.execute("UPDATE achievements SET kind = 'card' WHERE kind IS NULL")

    # 2) created_at: Date -> DateTime（前端排序、树内展示需要时间精度）。
    #    SQLite 里两代都是文本存储，老值补 ' 00:00:00.000000' 后缀即无损转换。
    with op.batch_alter_table("achievements") as batch:
        batch.add_column(sa.Column("created_at_new", sa.DateTime(), nullable=True))
    op.execute(
        "UPDATE achievements SET created_at_new = created_at || ' 00:00:00.000000' "
        "WHERE created_at IS NOT NULL"
    )
    with op.batch_alter_table("achievements") as batch:
        batch.drop_column("created_at")
        batch.alter_column(
            "created_at_new", new_column_name="created_at",
            existing_type=sa.DateTime(), existing_nullable=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("achievements") as batch:
        batch.drop_column("kind")
        batch.drop_column("parent_id")
        batch.drop_column("root_id")
        batch.drop_column("image_url")
    with op.batch_alter_table("achievements") as batch:
        batch.add_column(sa.Column("created_at_old", sa.Date(), nullable=True))
    op.execute("UPDATE achievements SET created_at_old = substr(created_at, 1, 10)")
    with op.batch_alter_table("achievements") as batch:
        batch.drop_column("created_at")
        batch.alter_column(
            "created_at_old", new_column_name="created_at",
            existing_type=sa.Date(), existing_nullable=True,
        )
