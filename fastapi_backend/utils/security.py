"""
Security utilities for password hashing and JWT tokens
"""
import logging
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import bcrypt as bcrypt_lib
from config import settings

logger = logging.getLogger(__name__)


def _prepare_password(password: str) -> bytes:
    """Prepare password for bcrypt by encoding and truncating to 72 bytes."""
    password_bytes = password.encode('utf-8')
    # bcrypt has a hard limit of 72 bytes
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    return password_bytes


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly."""
    try:
        password_bytes = _prepare_password(password)
        salt = bcrypt_lib.gensalt()
        hashed = bcrypt_lib.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt directly."""
    try:
        # Handle empty or invalid hash
        if not hashed_password:
            logger.warning("Empty password hash provided")
            return False
        
        password_bytes = _prepare_password(plain_password)
        hashed_bytes = hashed_password.encode('utf-8')
        
        return bcrypt_lib.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        return None


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    import random
    return str(random.randint(100000, 999999))


# OTP storage (in-memory for simplicity, use Redis in production)
_otp_storage: dict = {}


def store_otp(email: str, otp: str, expires_minutes: int = 10) -> bool:
    """Store OTP with expiration"""
    try:
        expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
        _otp_storage[email] = {
            "otp": otp,
            "expires_at": expires_at
        }
        return True
    except Exception as e:
        logger.error(f"Error storing OTP: {e}")
        return False


def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP for an email"""
    try:
        stored = _otp_storage.get(email)
        if not stored:
            return False
        
        if datetime.utcnow() > stored["expires_at"]:
            # OTP expired
            del _otp_storage[email]
            return False
        
        if stored["otp"] == otp:
            # OTP valid, remove it
            del _otp_storage[email]
            return True
        
        return False
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}")
        return False
