"""add users table

Revision ID: 96312e3b46ae
Revises: 58ce9f183370
Create Date: 2026-07-24 16:14:56.584833

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96312e3b46ae'
down_revision: Union[str, Sequence[str], None] = '58ce9f183370'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 修复记录：此迁移原先缺少 users 建表语句，且 ALTER/FK 未用 batch 模式，
    # 在 SQLite 上从未真正跑通过（一直被 main.py 的 create_all 掩盖）。
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.Date(), nullable=True),
    )
    with op.batch_alter_table('achievements') as batch:
        batch.add_column(sa.Column('created_at', sa.Date(), nullable=True))
        batch.add_column(sa.Column('user_id', sa.Integer(), nullable=False, server_default='1'))
        batch.alter_column('current_value', existing_type=sa.INTEGER(), nullable=True)
        batch.create_foreign_key('fk_achievements_user_id', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('achievements') as batch:
        batch.drop_constraint('fk_achievements_user_id', type_='foreignkey')
        batch.alter_column('current_value', existing_type=sa.INTEGER(), nullable=False)
        batch.drop_column('user_id')
        batch.drop_column('created_at')
    op.drop_table('users')
