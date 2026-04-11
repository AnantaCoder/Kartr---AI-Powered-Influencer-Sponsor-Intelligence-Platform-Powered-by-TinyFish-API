import logging
from datetime import datetime
from typing import Optional, Tuple, Dict, Any

from config import settings
from database import get_users_repository, get_mock_db, is_firebase_configured
from utils.security import hash_password, verify_password, create_access_token
from firebase_config import create_firebase_user, generate_password_reset_link

logger = logging.getLogger(__name__)


class AuthError(Exception):
    """Custom exception for authentication errors."""
    pass


class AuthService:
    """
    Service for authentication operations.
    
    Provides methods for user registration, authentication, and token management.
    Uses Firebase Firestore as the primary database with mock fallback.
    """
    
    # =========================================================================
    # User Registration
    # =========================================================================
    
    @staticmethod
    def register_user(
        username: str,
        email: str,
        password: str,
        user_type: str,
        full_name: str = ""
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Register a new user.
        
        Args:
            username: Unique username (3-50 characters)
            email: Valid email address
            password: Password (min 8 characters)
            user_type: Either 'influencer' or 'sponsor'
            full_name: User's full name (optional)
            
        Returns:
            Tuple of (success, user_data, error_message)
        """
        # Input validation
        if not username or len(username) < 3 or len(username) > 50:
            return False, None, "Username must be 3-50 characters"
        
        if not email or '@' not in email:
            return False, None, "Invalid email address"
        
        if not password or len(password) < 8:
            return False, None, "Password must be at least 8 characters"
        
        if user_type not in ('influencer', 'sponsor', 'admin'):
            return False, None, "User type must be 'influencer', 'sponsor', or 'admin'"
        
        # Normalize inputs
        email = email.lower().strip()
        username = username.strip()
        
        logger.info(f"Registering new user: {email}")
        
        try:
            # Hash password before storing
            password_hash = hash_password(password)
            
            user_data = {
                "username": username,
                "email": email,
                "password_hash": password_hash,
                "user_type": user_type,
                "full_name": full_name,
                "date_registered": datetime.utcnow().isoformat(),
                "email_visible": False,
            }
            
            # Try Firebase first
            users_repo = get_users_repository()
            if users_repo:
                return AuthService._register_with_firebase(
                    users_repo, user_data, email, username, password
                )
            
            # Fallback to mock database
            return AuthService._register_with_mock(user_data, email, username)
            
        except ValueError as e:
            error_msg = f"Password hashing error: {str(e)}"
            logger.error(f"Registration error for {email}: {error_msg}")
            return False, None, f"Registration failed: {error_msg}"
        except Exception as e:
            error_msg = str(e) if str(e) else "Unknown error occurred"
            logger.error(f"Registration error for {email}: {type(e).__name__}: {e}")
            return False, None, f"Registration failed: {error_msg}"
    
    @staticmethod
    def _register_with_firebase(
        users_repo,
        user_data: Dict[str, Any],
        email: str,
        username: str,
        password: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Register user with Firebase."""
        # Check for existing email
        existing = users_repo.find_one_by_field("email", email)
        if existing:
            logger.warning(f"Registration failed: email already exists - {email}")
            return False, None, "Email already registered"
        
        # Check for existing username
        existing = users_repo.find_one_by_field("username", username)
        if existing:
            logger.warning(f"Registration failed: username taken - {username}")
            return False, None, "Username already taken"
        
        # Create Firebase Auth user (optional, for future OAuth support)
        firebase_uid = create_firebase_user(email, password, username)
        if firebase_uid:
            user_data["firebase_uid"] = firebase_uid
        
        # Create user in Firestore
        created_user = users_repo.create(user_data)
        if not created_user:
            logger.error(f"Failed to create user in Firestore: {email}")
            return False, None, "Failed to create user"
        
        logger.info(f"User registered successfully: {email}")
        
        # Remove sensitive data before returning
        created_user.pop("password_hash", None)
        return True, created_user, None
    
    @staticmethod
    def _register_with_mock(
        user_data: Dict[str, Any],
        email: str,
        username: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Register user with mock database."""
        mock_db = get_mock_db()
        
        if mock_db.get_user_by_email(email):
            return False, None, "Email already registered"
        
        if mock_db.get_user_by_username(username):
            return False, None, "Username already taken"
        
        created_user = mock_db.create_user(user_data)
        logger.info(f"User registered in mock DB: {email}")
        
        # Remove sensitive data
        result = created_user.copy()
        result.pop("password_hash", None)
        return True, result, None
    
    # =========================================================================
    # User Authentication
    # =========================================================================
    
    @staticmethod
    def authenticate(email: str, password: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Authenticate a user with email and password.
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            Tuple of (success, user_data, error_message)
        """
        if not email or not password:
            return False, None, "Email and password are required"
        
        email = email.lower().strip()
        
        # Check for hardcoded admin login
        from services.admin_service import AdminService
        if AdminService.is_admin_email(email):
            return AdminService.authenticate_admin(email, password)
        
        logger.debug(f"Authentication attempt for: {email}")
        
        try:
            # Try Firebase first
            users_repo = get_users_repository()
            if users_repo:
                return AuthService._authenticate_firebase(users_repo, email, password)
            
            # Fallback to mock database
            return AuthService._authenticate_mock(email, password)
            
        except Exception as e:
            logger.error(f"Authentication error for {email}: {e}")
            return False, None, "Authentication failed"
    
    @staticmethod
    def _authenticate_firebase(
        users_repo,
        email: str,
        password: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Authenticate against Firebase."""
        user = users_repo.find_one_by_field("email", email)
        
        if not user:
            logger.debug(f"User not found: {email}")
            return False, None, "Invalid email or password"
        
        if not verify_password(password, user.get("password_hash", "")):
            logger.debug(f"Invalid password for: {email}")
            return False, None, "Invalid email or password"
        
        logger.info(f"User authenticated: {email}")
        
        # Remove sensitive data
        user.pop("password_hash", None)
        return True, user, None
    
    @staticmethod
    def _authenticate_mock(email: str, password: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Authenticate against mock database."""
        mock_db = get_mock_db()
        user = mock_db.get_user_by_email(email)
        
        if not user:
            return False, None, "Invalid email or password"
        
        if not verify_password(password, user.get("password_hash", "")):
            return False, None, "Invalid email or password"
        
        logger.info(f"User authenticated (mock): {email}")
        
        result = user.copy()
        result.pop("password_hash", None)
        return True, result, None
    
    # Backward compatibility alias
    @staticmethod
    def authenticate_user(email: str, password: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Alias for authenticate(). Kept for backward compatibility."""
        return AuthService.authenticate(email, password)
    
    # Backward compatibility alias
    @staticmethod
    def create_user(
        username: str,
        email: str,
        password: str,
        user_type: str,
        full_name: str = ""
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Alias for register_user(). Kept for backward compatibility."""
        return AuthService.register_user(username, email, password, user_type, full_name)
    
    # =========================================================================
    # Token Management
    # =========================================================================
    
    @staticmethod
    def generate_token(user: Dict[str, Any]) -> str:
        """
        Generate a JWT access token for an authenticated user.
        
        Args:
            user: User data dictionary (must contain id, email, username, user_type)
            
        Returns:
            JWT token string
        """
        if not user or not user.get("id"):
            raise AuthError("Invalid user data for token generation")
        
        token_data = {
            "sub": str(user.get("id")),
            "email": user.get("email"),
            "username": user.get("username"),
            "user_type": user.get("user_type"),
        }
        
        return create_access_token(token_data)
    
    # =========================================================================
    # User Queries
    # =========================================================================
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email address.
        
        Args:
            email: User's email address
            
        Returns:
            User data (without password) or None
        """
        if not email:
            return None
        
        email = email.lower().strip()
        
        try:
            users_repo = get_users_repository()
            if users_repo:
                user = users_repo.find_one_by_field("email", email)
                if user:
                    user.pop("password_hash", None)
                    return user
            
            mock_db = get_mock_db()
            user = mock_db.get_user_by_email(email)
            if user:
                result = user.copy()
                result.pop("password_hash", None)
                return result
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    @staticmethod
    def get_user_by_id(user_id) -> Optional[Dict[str, Any]]:
        """
        Get user by ID.
        
        Args:
            user_id: User's ID
            
        Returns:
            User data (without password) or None
        """
        if not user_id:
            return None
        
        try:
            users_repo = get_users_repository()
            if users_repo:
                user = users_repo.find_by_id(str(user_id))
                if user:
                    user.pop("password_hash", None)
                    return user
            
            mock_db = get_mock_db()
            user = mock_db.get_user_by_id(user_id)
            if user:
                result = user.copy()
                result.pop("password_hash", None)
                return result
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    @staticmethod
    def update_user(user_id, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update user data.
        
        Args:
            user_id: User's ID
            data: Fields to update
            
        Returns:
            Updated user data or None on failure
        """
        if not user_id:
            return None
        
        # Never allow updating sensitive fields via this method
        protected_fields = {"id", "password_hash", "email", "firebase_uid"}
        
        # Allow updating bluesky_password securely
        allowed_extra_fields = {"bluesky_handle", "bluesky_password"}
        
        data = {k: v for k, v in data.items() if k not in protected_fields or k in allowed_extra_fields}
        
        logger.info(f"Updating user {user_id} with data: {data}")

        if not data:
            logger.warning(f"Update user failed: No valid data to update for {user_id}")
            return None
        
        try:
            users_repo = get_users_repository()
            if users_repo:
                logger.info(f"Using Firestore repository for update")
                user = users_repo.update(str(user_id), data)
                if user:
                    logger.info(f"Firestore update successful for {user_id}")
                    user.pop("password_hash", None)
                    return user
                else:
                    logger.error(f"Firestore update returned None for {user_id}")
            
            mock_db = get_mock_db()
            logger.info(f"Using Mock DB for update")
            user = mock_db.update_user(user_id, data)
            if user:
                result = user.copy()
                result.pop("password_hash", None)
                return result
            
            logger.error(f"Mock DB update returned None for {user_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return None
    
    # =========================================================================
    # Password Reset
    # =========================================================================
    
    @staticmethod
    def send_password_reset(email: str) -> Tuple[bool, Optional[str]]:
        """
        Initiate password reset for a user.
        
        Args:
            email: User's email address
            
        Returns:
            Tuple of (success, error_message)
        """
        from services.email_service import EmailService
        
        if not email:
            return False, "Email is required"
        
        email = email.lower().strip()
        
        logger.info(f"Password reset requested for: {email}")
        
        try:
            # Check if user exists - reject if not found
            user = AuthService.get_user_by_email(email)
            if not user:
                logger.info(f"Password reset rejected: email not found - {email}")
                return False, "Email not found. Please register first."
            
            # Try Firebase password reset link
            if is_firebase_configured():
                link = generate_password_reset_link(email)
                if link:
                    # Send the reset link via email
                    success, error = EmailService.send_password_reset_link_email(email, link)
                    if success:
                        logger.info(f"Password reset link email sent to: {email}")
                        return True, None
                    else:
                        logger.warning(f"Failed to send reset link email: {error}")
                        # Fall through to OTP if email fails
            
            # Fallback to OTP
            from utils.security import generate_otp, store_otp
            otp = generate_otp()
            if store_otp(email, otp):
                # Send OTP via email
                success, error = EmailService.send_password_reset_email(email, otp)
                if success:
                    logger.info(f"Password reset OTP email sent to: {email}")
                    return True, None
                else:
                    logger.error(f"Failed to send password reset OTP email: {error}")
                    return False, f"Failed to send email: {error}"
            
            return False, "Failed to initiate password reset"
            
        except Exception as e:
            logger.error(f"Password reset error for {email}: {e}")
            return False, "Password reset failed"
    
    # =========================================================================
    # OAuth (Placeholder)
    # =========================================================================
    
    @staticmethod
    def get_google_oauth_url(redirect_url: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Get Google OAuth URL.
        
        Note: With Firebase, OAuth is handled client-side using Firebase JS SDK.
        This method returns guidance for client-side implementation.
        
        Args:
            redirect_url: URL to redirect after OAuth
            
        Returns:
            Tuple of (success, url_or_message, error)
        """
        return (
            False,
            None,
            "OAuth is handled client-side with Firebase. Use Firebase JS SDK for Google sign-in."
        )
    
    @staticmethod
    def handle_oauth_callback(
        id_token: str,
        refresh_token: Optional[str] = None,
        user_type: str = "influencer"
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Handle OAuth callback by verifying Firebase ID token.
        
        Args:
            id_token: Firebase ID token from client-side auth
            refresh_token: Optional refresh token (not used with Firebase)
            user_type: User type for new users (influencer/sponsor)
            
        Returns:
            Tuple of (success, user_data, error_message)
        """
        from firebase_config import verify_firebase_id_token
        
        if not id_token:
            return False, None, "ID token is required"
        
        try:
            decoded = verify_firebase_id_token(id_token)
            if not decoded:
                return False, None, "Invalid or expired token"
            
            email = decoded.get("email")
            if not email:
                return False, None, "Token does not contain email"
            
            # Check if user exists
            user = AuthService.get_user_by_email(email)
            if user:
                return True, user, None
            
            # Create new user from OAuth
            username = decoded.get("name", email.split("@")[0])
            user_data = {
                "username": username,
                "email": email,
                "password_hash": "",
                "user_type": user_type,
                "date_registered": datetime.utcnow().isoformat(),
                "email_visible": False,
                "firebase_uid": decoded.get("uid"),
                "avatar_url": decoded.get("picture"),
            }
            
            users_repo = get_users_repository()
            if users_repo:
                created = users_repo.create(user_data)
                if created:
                    created.pop("password_hash", None)
                    return True, created, None
            else:
                mock_db = get_mock_db()
                created = mock_db.create_user(user_data)
                result = created.copy()
                result.pop("password_hash", None)
                return True, result, None
            
            return False, None, "Failed to create user"
            
        except Exception as e:
            logger.error(f"OAuth callback error: {e}")
            return False, None, "OAuth authentication failed"
