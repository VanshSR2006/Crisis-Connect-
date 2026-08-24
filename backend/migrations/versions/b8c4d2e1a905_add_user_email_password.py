"""add_user_email_password

Revision ID: b8c4d2e1a905
Revises: a9b59bc70826
Create Date: 2026-08-23 20:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b8c4d2e1a905'
down_revision: Union[str, Sequence[str], None] = 'a9b59bc70826'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema to add email and password_hash to users table."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('password_hash', sa.String(), nullable=True))
        batch_op.create_unique_constraint('uq_users_email', ['email'])

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('uq_users_email', type_='unique')
        batch_op.drop_column('password_hash')
        batch_op.drop_column('email')
