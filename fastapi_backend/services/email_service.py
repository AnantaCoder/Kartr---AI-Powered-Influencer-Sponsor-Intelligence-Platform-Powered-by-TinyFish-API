"""
Email service for sending OTP and notifications
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple
from config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def _get_smtp_connection():
        """Create and return an SMTP connection using configured settings."""
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        return server
    
    @staticmethod
    def _is_configured() -> bool:
        """Check if email service is configured."""
        return bool(settings.EMAIL_USER and settings.EMAIL_PASSWORD)
    
    @staticmethod
    def send_otp_email(email: str, otp: str) -> Tuple[bool, str]:
        """
        Send OTP to user's email.
        Returns: (success, message)
        """
        if not EmailService._is_configured():
            logger.warning("Email credentials not configured")
            return False, "Email service not configured"
        
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.EMAIL_USER
            msg['To'] = email
            msg['Subject'] = 'Kartr - Your Verification Code'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">Kartr Verification Code</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px;">{otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                    <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br><strong>The Kartr Team</strong></p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            with EmailService._get_smtp_connection() as server:
                server.send_message(msg)
            
            logger.info(f"OTP email sent to {email}")
            return True, "OTP sent successfully"
            
        except Exception as e:
            logger.error(f"Error sending OTP email: {e}")
            return False, str(e)
    
    @staticmethod
    def send_password_reset_email(email: str, otp: str) -> Tuple[bool, str]:
        """
        Send password reset OTP to user's email.
        Returns: (success, message)
        """
        if not EmailService._is_configured():
            logger.warning("Email credentials not configured")
            return False, "Email service not configured"
        
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.EMAIL_USER
            msg['To'] = email
            msg['Subject'] = 'Kartr - Password Reset Request'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #FF5722;">Password Reset Request</h2>
                    <p>We received a request to reset your password for your Kartr account.</p>
                    <p>Use this verification code to reset your password:</p>
                    <h1 style="color: #FF5722; font-size: 32px; letter-spacing: 5px; background: #fff3e0; padding: 20px; text-align: center; border-radius: 8px;">{otp}</h1>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                    <br>
                    <p>Best regards,<br><strong>The Kartr Team</strong></p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            with EmailService._get_smtp_connection() as server:
                server.send_message(msg)
            
            logger.info(f"Password reset email sent to {email}")
            return True, "Password reset email sent successfully"
            
        except Exception as e:
            logger.error(f"Error sending password reset email: {e}")
            return False, str(e)
    
    @staticmethod
    def send_password_reset_link_email(email: str, reset_link: str) -> Tuple[bool, str]:
        """
        Send password reset link to user's email (Firebase reset link).
        Returns: (success, message)
        """
        if not EmailService._is_configured():
            logger.warning("Email credentials not configured")
            return False, "Email service not configured"
        
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.EMAIL_USER
            msg['To'] = email
            msg['Subject'] = 'Kartr - Password Reset Request'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #FF5722;">Password Reset Request</h2>
                    <p>We received a request to reset your password for your Kartr account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background-color: #FF5722; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                    <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">{reset_link}</p>
                    <p>This link will expire in <strong>1 hour</strong>.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                    <br>
                    <p>Best regards,<br><strong>The Kartr Team</strong></p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            with EmailService._get_smtp_connection() as server:
                server.send_message(msg)
            
            logger.info(f"Password reset link email sent to {email}")
            return True, "Password reset link sent successfully"
            
        except Exception as e:
            logger.error(f"Error sending password reset link email: {e}")
            return False, str(e)
    
    @staticmethod
    def send_welcome_email(email: str, username: str) -> Tuple[bool, str]:
        """
        Send welcome email to new user.
        Returns: (success, message)
        """
        if not EmailService._is_configured():
            return False, "Email service not configured"
        
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.EMAIL_USER
            msg['To'] = email
            msg['Subject'] = 'Welcome to Kartr!'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">Welcome to Kartr, {username}!</h2>
                    <p>Thank you for joining our platform connecting influencers and sponsors.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Analyze YouTube channels and videos</li>
                        <li>Connect with potential partners</li>
                        <li>Generate promotional content</li>
                    </ul>
                    <p>Get started by logging in to your account.</p>
                    <br>
                    <p>Best regards,<br><strong>The Kartr Team</strong></p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            with EmailService._get_smtp_connection() as server:
                server.send_message(msg)
            
            logger.info(f"Welcome email sent to {email}")
            return True, "Welcome email sent"
            
        except Exception as e:
            logger.error(f"Error sending welcome email: {e}")
            return False, str(e)


# Global service instance
email_service = EmailService()
