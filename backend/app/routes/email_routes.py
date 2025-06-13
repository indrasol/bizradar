from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from config.settings import SENDGRID_API_KEY
from utils.logger import get_logger

router = APIRouter()

logger = get_logger(__name__)

class WelcomeEmailRequest(BaseModel):
    email: str
    name: str
    unsubscribe_link: str

@router.post("/send-welcome-email")
async def send_welcome_email(request: WelcomeEmailRequest):
    try:
        if not SENDGRID_API_KEY:
            raise ValueError("SendGrid API key is not configured")
            
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        
        # Create welcome email
        message = Mail(
            from_email=Email('srvc.bizradar@indrasol.com', 'Bizradar Team'),
            to_emails=To(request.email),
            subject='Welcome to Bizradar Newsletter!',
            html_content=Content(
                'text/html',
                f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Welcome to Bizradar!</h1>
                    <p>Hi {request.name},</p>
                    <p>Thank you for subscribing to our newsletter! We're excited to have you join our community.</p>
                    <p>You'll receive updates about:</p>
                    <ul>
                        <li>Latest contract opportunities</li>
                        <li>Industry insights and trends</li>
                        <li>Tips for successful bidding</li>
                        <li>Platform updates and new features</li>
                    </ul>
                    <p>If you have any questions or need assistance, feel free to reply to this email.</p>
                    <p>Best regards,<br>The Bizradar Team</p>
                    <hr style="margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        If you wish to unsubscribe, <a href="{request.unsubscribe_link}">click here</a>.
                    </p>
                </div>
                '''
            )
        )
        
        # Send email
        response = sg.send(message)
        logger.info(f"SendGrid Response Status: {response.status_code}")
        logger.info(f"SendGrid Response Headers: {response.headers}")
        logger.info(f"SendGrid Response Body: {response.body}")
        logger.info(f"Email sent successfully to {request.email}")
        
        return {"success": True, "message": "Welcome email sent successfully"}
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 