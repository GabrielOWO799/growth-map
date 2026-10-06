"""add images asset table

Revision ID: e8f2a6c94d10
Revises: d4a8e6f2c910
Create Date: 2026-10-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8f2a6c94d10'
down_revision: Union[str, Sequence[str], None] = 'd4a8e6f2c910'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'images',
        sa.Column('id', sa.String(length=32), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('data', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('images')
