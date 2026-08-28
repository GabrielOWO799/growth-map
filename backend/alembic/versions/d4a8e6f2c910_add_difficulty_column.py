"""add difficulty column

Revision ID: d4a8e6f2c910
Revises: b7e4c2d90a16
Create Date: 2026-08-23 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4a8e6f2c910'
down_revision: Union[str, Sequence[str], None] = 'b7e4c2d90a16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 难度评级 A/B/C（AI 推演建议 + 用户终选），老数据为 NULL 表示未评级
    with op.batch_alter_table("achievements") as batch:
        batch.add_column(sa.Column("difficulty", sa.String(length=1), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("achievements") as batch:
        batch.drop_column("difficulty")
