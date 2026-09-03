"""add_audit_immutability_trigger

Revision ID: 5c1736e5414e
Revises: 166e340a91c7
Create Date: 2026-09-04 03:01:33.829968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5c1736e5414e'
down_revision: Union[str, Sequence[str], None] = '166e340a91c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add PostgreSQL trigger to enforce append-only immutability on audit_events."""
    op.execute("""
    CREATE OR REPLACE FUNCTION prevent_audit_events_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'Audit events table is append-only. UPDATE and DELETE operations are strictly prohibited.';
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS trg_audit_events_immutable ON audit_events;
    CREATE TRIGGER trg_audit_events_immutable
    BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_events_mutation();
    """)


def downgrade() -> None:
    """Remove immutability trigger."""
    op.execute("DROP TRIGGER IF EXISTS trg_audit_events_immutable ON audit_events;")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_events_mutation();")
