from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import HTTPException

from app.utils.db_utils import get_db_connection


def _ensure_subscription_table_exists() -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if table already exists (from Supabase migration)
            cursor.execute(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'user_subscriptions'
                );
                """
            )
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                # Create table without foreign key constraint for local development
                cursor.execute(
                    """
                    CREATE TABLE user_subscriptions (
                        id SERIAL PRIMARY KEY,
                        user_id UUID UNIQUE NOT NULL,
                        plan_type TEXT NOT NULL,
                        status TEXT NOT NULL,
                        start_date TIMESTAMP NOT NULL,
                        end_date TIMESTAMP NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
                    """
                )
            
            # Ensure plan_type constraint (update existing constraint if needed)
            try:
                cursor.execute(
                    """
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.table_constraints
                            WHERE constraint_name = 'user_subscriptions_plan_type_check'
                              AND table_name = 'user_subscriptions'
                        ) THEN
                            ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_plan_type_check;
                        END IF;
                    END$$;
                    """
                )
                cursor.execute(
                    """
                    ALTER TABLE user_subscriptions
                    ADD CONSTRAINT user_subscriptions_plan_type_check
                    CHECK (plan_type IN ('basic','pro','premium'));
                    """
                )
            except Exception:
                pass
            conn.commit()
    finally:
        conn.close()


def _fetch_user_subscription(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Return the most recent subscription row for a user from user_subscriptions table.
    Assumes at most one row per user (ON CONFLICT on user_id elsewhere), but is
    robust to multiple by taking the latest by start_date.
    """
    _ensure_subscription_table_exists()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, user_id, plan_type, status, start_date, end_date
                FROM user_subscriptions
                WHERE user_id = %s
                ORDER BY start_date DESC NULLS LAST
                LIMIT 1
                """,
                (user_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "user_id": row[1],
                "plan_type": row[2],
                "status": row[3],
                "start_date": row[4],
                "end_date": row[5],
            }
    finally:
        conn.close()




def _create_basic_subscription(user_id: str) -> Dict[str, Any]:
    """
    Create a basic subscription for new users.
    This function creates a basic subscription for any valid user_id.
    """
    now = datetime.now(timezone.utc)
    _ensure_subscription_table_exists()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_subscriptions (user_id, plan_type, status, start_date, end_date)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (user_id)
                DO UPDATE SET plan_type = EXCLUDED.plan_type,
                              status = EXCLUDED.status,
                              start_date = EXCLUDED.start_date,
                              end_date = EXCLUDED.end_date
                RETURNING id, user_id, plan_type, status, start_date, end_date
                """,
                (user_id, "basic", "active", now.isoformat(), None),  # No end date for basic plan
            )
            row = cursor.fetchone()
            conn.commit()
            return {
                "id": row[0],
                "user_id": row[1],
                "plan_type": row[2],
                "status": row[3],
                "start_date": row[4],
                "end_date": row[5],
            }
    finally:
        conn.close()


def _expire_subscription(user_id: str) -> None:
    _ensure_subscription_table_exists()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE user_subscriptions
                SET status = 'expired'
                WHERE user_id = %s AND status = 'active'
                """,
                (user_id,),
            )
            conn.commit()
    finally:
        conn.close()


def ensure_active_access(user_id: Optional[str]) -> None:
    """
    Ensure the user has an active subscription.
    If the user has no subscription, automatically create a basic subscription.
    """
    if not user_id or user_id == "anonymous":
        raise HTTPException(status_code=401, detail="Authentication required")

    sub = _fetch_user_subscription(user_id)
    if not sub:
        # Create a basic subscription for new users
        _create_basic_subscription(user_id)
        return

    status = (sub.get("status") or "").lower()
    plan = (sub.get("plan_type") or "").lower()
    end_date = sub.get("end_date")

    # Normalize end_date possibly coming as string or datetime
    if isinstance(end_date, str):
        try:
            end_date = datetime.fromisoformat(end_date)
        except Exception:
            end_date = None

    now = datetime.now(timezone.utc)

    if status != "active":
        raise HTTPException(status_code=402, detail="Subscription inactive. Please upgrade your plan to continue.")

    # Paid plan: optionally validate end_date if present
    if end_date and now > end_date:
        _expire_subscription(user_id)
        raise HTTPException(status_code=402, detail="Your subscription has expired. Please renew to continue using BizRadar.")

    return


def get_subscription_status(user_id: Optional[str], create_if_missing: bool = True) -> Dict[str, Any]:
    """
    Return current subscription status for a user without raising HTTP errors.
    Output: { plan_type, status, start_date, end_date, remaining_days, is_trial, expired }
    """
    if not user_id or user_id == "anonymous":
        raise HTTPException(status_code=401, detail="Authentication required")

    sub = _fetch_user_subscription(user_id)

    if not sub:
        # No subscription found: report no access
        return {
            "plan_type": None,
            "status": "none",
            "start_date": None,
            "end_date": None,
            "remaining_days": 0,
            "is_trial": False,
            "expired": True,
            "newly_created": False,
        }

    plan = (sub.get("plan_type") or "").lower()
    status = (sub.get("status") or "").lower()
    start_date = sub.get("start_date")
    end_date = sub.get("end_date")

    # Normalize datetime parsing
    if isinstance(start_date, str):
        try:
            start_date = datetime.fromisoformat(start_date)
        except Exception:
            start_date = None
    if isinstance(end_date, str):
        try:
            end_date = datetime.fromisoformat(end_date)
        except Exception:
            end_date = None

    now = datetime.utcnow()
    remaining_days = 0
    expired = False
    # Normalize datetimes to UTC-aware
    def _to_utc(dt: datetime) -> datetime:
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    start_date = _to_utc(start_date)
    end_date = _to_utc(end_date)
    now = datetime.now(timezone.utc)

    if end_date:
        delta = end_date - now
        remaining_days = max(0, delta.days + (1 if delta.seconds > 0 else 0))
        expired = delta.total_seconds() < 0 or status != "active"
    else:
        # No end date (could be lifetime plan); treat as non-expired when active
        expired = status != "active"

    return {
        "plan_type": plan,
        "status": status,
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "remaining_days": remaining_days,
        "is_trial": False,
        "expired": expired,
        "newly_created": False,
    }


