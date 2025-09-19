import sys
from pathlib import Path
from typing import Dict, List, Any

# Ensure 'backend' directory is on sys.path so that 'app' package is importable
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))


# Imports that rely on the app package
from app.database.supabase import get_supabase_client
from app.utils.logger import get_logger
from app.services.profile_opportunity_rag import get_top_matches_for_profile

# Settings (support both import paths depending on runner)
try:
    from app.config import settings as app_settings
except Exception:
    from config import settings as app_settings

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content


logger = get_logger(__name__)


def fetch_premium_users_with_email() -> List[Dict[str, Any]]:
    """
    Return list of { user_id, email } for users on premium plan.
    Uses public.user_subscriptions and public.profiles.
    """
    supabase = get_supabase_client()

    # Get users with current_subscription_plan == 'premium'
    subs = (
        supabase
        .table('user_subscriptions')
        .select('user_id, current_subscription_plan')
        .eq('current_subscription_plan', 'premium')
        .execute()
    )
    rows = subs.data or []
    if not rows:
        return []

    user_ids = [r.get('user_id') for r in rows if r.get('user_id')]
    if not user_ids:
        return []

    # Fetch emails from profiles for these user_ids (chunk to avoid limit issues)
    results: List[Dict[str, Any]] = []
    chunk_size = 200
    for i in range(0, len(user_ids), chunk_size):
        chunk = user_ids[i:i + chunk_size]
        prof = (
            supabase
            .table('profiles')
            .select('id, email')
            .in_('id', chunk)
            .execute()
        )
        for row in (prof.data or []):
            uid = row.get('id')
            email = row.get('email')
            if uid and email:
                results.append({'user_id': uid, 'email': email})

    return results


def build_recommendations_email_html(recommendations: List[Dict[str, Any]]) -> str:
    base_url = app_settings.REDIRECT_URL
    count = len(recommendations)

    items_html: List[str] = []
    for doc in recommendations:
        opp_id = doc.get('id') or doc.get('opportunity_id')
        title = doc.get('title') or doc.get('opportunity_title') or 'Opportunity'
        if opp_id is None:
            continue
        details_url = f"{base_url}/opportunities/{opp_id}/details"
        items_html.append(
            f"""
            <li style='margin:12px 0;'>
                <div style='font-weight:600;color:#111827'>{title}</div>
                <a href='{details_url}' style='display:inline-block;margin-top:6px;padding:8px 12px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;'>View details</a>
            </li>
            """
        )

    items = "\n".join(items_html) if items_html else "<li>No opportunities found this time.</li>"

    html = f"""
    <div style='font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;'>
      <h2 style='color:#111827;margin-bottom:6px;'>Your Bizradar recommendations</h2>
      <p style='color:#374151;margin-top:0;'>We found <strong>{count}</strong> opportunities for you.</p>
      <ul style='padding-left:18px;'>
        {items}
      </ul>
      <hr style='margin:20px 0;border:none;border-top:1px solid #e5e7eb;' />
      <p style='font-size:12px;color:#6b7280;'>You received this because you are on the Premium plan.</p>
    </div>
    """
    return html


def send_recommendations_email(to_email: str, html_content: str, count: int) -> None:
    api_key = app_settings.SENDGRID_API_KEY
    if not api_key:
        raise RuntimeError('SendGrid API key is not configured')

    sg = SendGridAPIClient(api_key)
    message = Mail(
        from_email=Email('srvc.bizradar@indrasol.com', 'Bizradar Team'),
        to_emails=To(to_email),
        subject=f"Your {count} Bizradar recommendations",
        html_content=Content('text/html', html_content)
    )

    response = sg.send(message)
    logger.info(f"SendGrid status={response.status_code} to={to_email}")


def get_user_recommendations(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    try:
        docs = get_top_matches_for_profile(user_id=user_id, top_n=limit, only_active=True)
        return docs[:limit]
    except Exception as e:
        logger.exception(f"Failed to get recommendations for user {user_id}: {e}")
        return []


def run() -> Dict[str, Any]:
    logger.info("Starting premium recommendations alert run")

    users = fetch_premium_users_with_email()
    logger.info(f"Found {len(users)} premium users with email")

    sent = 0
    skipped = 0

    for u in users:
        user_id = u['user_id']
        email = u['email']

        recommendations = get_user_recommendations(user_id, limit=5)
        if not recommendations:
            skipped += 1
            continue

        html = build_recommendations_email_html(recommendations)
        try:
            send_recommendations_email(email, html, len(recommendations))
            sent += 1
        except Exception as e:
            logger.exception(f"Email send failed to {email}: {e}")
            skipped += 1

    logger.info(f"Recommendations alert complete sent={sent} skipped={skipped}")
    return {"sent": sent, "skipped": skipped, "total": len(users)}


if __name__ == "__main__":
    run()
