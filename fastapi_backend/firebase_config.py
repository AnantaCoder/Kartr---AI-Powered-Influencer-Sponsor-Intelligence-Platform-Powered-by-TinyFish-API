"""
Firebase configuration and initialization.

This module provides Firebase Admin SDK initialization and Firestore client access.
Firebase is used for authentication and as the primary database (Firestore).
"""
import os
import json
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Firebase Admin SDK availability check
try:
    import firebase_admin
    from firebase_admin import credentials, firestore, auth as firebase_auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    firebase_admin = None
    firestore = None
    firebase_auth = None
    logger.warning("Firebase Admin SDK not installed or disabled. Using mock database only.")

# FORCE DISABLE FIREBASE FOR TESTING IF NEEDED
# FIREBASE_AVAILABLE = False


# Module-level state for singleton pattern
_firebase_app: Optional[Any] = None
_firestore_client: Optional[Any] = None


def _load_credentials_from_env_vars() -> Optional[Any]:
    """
    Load Firebase credentials from individual environment variables.
    
    Required env vars:
    - FIREBASE_PROJECT_ID
    - FIREBASE_PRIVATE_KEY (with newlines as \\n)
    - FIREBASE_CLIENT_EMAIL
    
    Returns:
        Firebase credentials object or None if not configured
    """
    project_id = os.getenv('FIREBASE_PROJECT_ID', '').strip()
    private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').strip()
    client_email = os.getenv('FIREBASE_CLIENT_EMAIL', '').strip()
    
    if not all([project_id, private_key, client_email]):
        return None
    
    try:
        # Handle escaped newlines in private key
        private_key = private_key.replace('\\n', '\n')
        
        creds_dict = {
            "type": "service_account",
            "project_id": project_id,
            "private_key": private_key,
            "client_email": client_email,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        
        # Optional additional fields
        if os.getenv('FIREBASE_PRIVATE_KEY_ID'):
            creds_dict["private_key_id"] = os.getenv('FIREBASE_PRIVATE_KEY_ID')
        if os.getenv('FIREBASE_CLIENT_ID'):
            creds_dict["client_id"] = os.getenv('FIREBASE_CLIENT_ID')
        
        logger.info("Loading Firebase credentials from individual environment variables")
        return credentials.Certificate(creds_dict)
    except Exception as e:
        logger.error(f"Failed to create credentials from env vars: {e}")
        return None


def _load_credentials_from_env() -> Optional[Any]:
    """
    Load Firebase credentials from environment.
    
    Supports multiple formats (checked in order):
    1. Individual environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)
    2. JSON string in FIREBASE_CREDENTIALS env var
    3. Path to a JSON service account file in FIREBASE_CREDENTIALS
    4. Auto-detect common Firebase credential files as fallback
    
    Returns:
        Firebase credentials object or None if not configured
    """
    from config import settings
    
    # First, try individual environment variables (preferred for deployment)
    env_creds = _load_credentials_from_env_vars()
    if env_creds:
        return env_creds
    
    creds_value = getattr(settings, 'FIREBASE_CREDENTIALS', '').strip()
    
    # Common credential file patterns to try as fallback
    common_cred_files = [
        'kartr-firebase-adminsdk.json',
        'firebase-adminsdk.json',
        'firebase-service-account.json',
        'service-account.json',
    ]
    
    # If creds_value is a JSON string, parse it
    if creds_value and creds_value.startswith('{'):
        try:
            creds_dict = json.loads(creds_value)
            return credentials.Certificate(creds_dict)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in FIREBASE_CREDENTIALS: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to create credentials from JSON: {e}")
            return None
    
    # Build list of paths to try
    paths_to_try = []
    base_dir = os.path.dirname(__file__)
    
    # Add configured path first (if provided)
    if creds_value:
        if os.path.isabs(creds_value):
            paths_to_try.append(creds_value)
        else:
            paths_to_try.append(os.path.join(base_dir, creds_value))
    
    # Add common fallback paths
    for filename in common_cred_files:
        fallback_path = os.path.join(base_dir, filename)
        if fallback_path not in paths_to_try:
            paths_to_try.append(fallback_path)
    
    # Try each path
    for cred_path in paths_to_try:
        if os.path.exists(cred_path):
            try:
                logger.info(f"Loading Firebase credentials from: {cred_path}")
                return credentials.Certificate(cred_path)
            except Exception as e:
                logger.error(f"Failed to load credentials from {cred_path}: {e}")
                continue
    
    logger.error(f"Firebase credentials file not found. Tried: {paths_to_try}")
    return None


def initialize_firebase() -> bool:
    """
    Initialize Firebase Admin SDK.
    
    This function is idempotent - calling it multiple times is safe.
    
    Returns:
        True if Firebase is initialized and ready, False otherwise
    """
    global _firebase_app, _firestore_client
    
    if not FIREBASE_AVAILABLE:
        return False
    
    # Already initialized
    if _firebase_app is not None:
        return True
    
    creds = _load_credentials_from_env()
    if creds is None:
        logger.warning("Firebase credentials not configured. Database operations will use mock.")
        return False
    
    try:
        _firebase_app = firebase_admin.initialize_app(creds)
        _firestore_client = firestore.client()
        logger.info("Firebase initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        _firebase_app = None
        _firestore_client = None
        return False


def get_firestore() -> Optional[Any]:
    """
    Get Firestore client instance.
    
    Returns:
        Firestore client or None if not available
    """
    global _firestore_client
    
    if _firestore_client is None:
        initialize_firebase()
    
    return _firestore_client


def get_auth() -> Optional[Any]:
    """
    Get Firebase Auth module.
    
    Returns:
        Firebase auth module or None if not available
    """
    if not FIREBASE_AVAILABLE:
        return None
    
    if _firebase_app is None:
        if not initialize_firebase():
            return None
    
    return firebase_auth


# =============================================================================
# Firestore Database Operations
# =============================================================================

class FirestoreRepository:
    """
    Repository for Firestore database operations.
    
    Provides simple, explicit methods for CRUD operations on Firestore collections.
    Each method clearly states its purpose and handles errors appropriately.
    """
    
    def __init__(self, collection_name: str):
        """
        Initialize repository for a specific collection.
        
        Args:
            collection_name: Name of the Firestore collection
        """
        self.collection_name = collection_name
        self._db = get_firestore()
    
    @property
    def db(self):
        """Lazy-load Firestore client in case it wasn't available at init time."""
        if self._db is None:
            self._db = get_firestore()
        return self._db
    
    def find_by_field(self, field: str, value: Any) -> List[Dict[str, Any]]:
        """
        Find documents where field equals value.
        
        Args:
            field: Field name to query
            value: Value to match
            
        Returns:
            List of matching documents as dictionaries with 'id' included
        """
        if self.db is None:
            logger.warning(f"Firestore not available for query on {self.collection_name}")
            return []
        
        try:
            query = self.db.collection(self.collection_name).where(field, '==', value)
            docs = query.stream()
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(data)
            
            return results
            
        except Exception as e:
            logger.error(f"Firestore query error on {self.collection_name}: {e}")
            return []
    
    def find_one_by_field(self, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """
        Find a single document where field equals value.
        
        Args:
            field: Field name to query
            value: Value to match
            
        Returns:
            First matching document or None
        """
        results = self.find_by_field(field, value)
        return results[0] if results else None
    
    def find_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Find document by its ID.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document data with 'id' or None if not found
        """
        if self.db is None:
            return None
        
        try:
            doc_ref = self.db.collection(self.collection_name).document(str(doc_id))
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            
            return None
            
        except Exception as e:
            logger.error(f"Firestore get error on {self.collection_name}/{doc_id}: {e}")
            return None
    
    def create(self, data: Dict[str, Any], doc_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Create a new document.
        
        Args:
            data: Document data
            doc_id: Optional document ID. If not provided, Firestore generates one.
            
        Returns:
            Created document with 'id' or None on failure
        """
        if self.db is None:
            logger.error(f"Firestore not available for create on {self.collection_name}")
            return None
        
        try:
            collection_ref = self.db.collection(self.collection_name)
            
            # Make a copy to avoid mutating the input
            doc_data = data.copy()
            
            if doc_id:
                doc_ref = collection_ref.document(str(doc_id))
                doc_ref.set(doc_data)
            else:
                _, doc_ref = collection_ref.add(doc_data)
            
            doc_data['id'] = doc_ref.id
            logger.debug(f"Created document in {self.collection_name}: {doc_ref.id}")
            return doc_data
            
        except Exception as e:
            logger.error(f"Firestore create error on {self.collection_name}: {e}")
            return None
    
    def update(self, doc_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing document.
        
        Args:
            doc_id: Document ID to update
            data: Fields to update (partial update)
            
        Returns:
            Updated document with 'id' or None on failure
        """
        if self.db is None:
            return None
        
        try:
            doc_ref = self.db.collection(self.collection_name).document(str(doc_id))
            
            # Check if document exists first
            if not doc_ref.get().exists:
                logger.warning(f"Document not found for update: {self.collection_name}/{doc_id}")
                return None
            
            doc_ref.update(data)
            
            # Fetch and return updated document
            updated_doc = doc_ref.get()
            result = updated_doc.to_dict()
            result['id'] = doc_id
            
            logger.debug(f"Updated document in {self.collection_name}: {doc_id}")
            return result
            
        except Exception as e:
            logger.error(f"Firestore update error on {self.collection_name}/{doc_id}: {e}")
            return None
    
    def delete(self, doc_id: str) -> bool:
        """
        Delete a document by ID.
        
        Args:
            doc_id: Document ID to delete
            
        Returns:
            True if deleted, False on failure
        """
        if self.db is None:
            return False
        
        try:
            doc_ref = self.db.collection(self.collection_name).document(str(doc_id))
            doc_ref.delete()
            logger.debug(f"Deleted document from {self.collection_name}: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Firestore delete error on {self.collection_name}/{doc_id}: {e}")
            return False
    
    def find_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all documents in collection with optional limit.
        
        Args:
            limit: Maximum number of documents to return
            
        Returns:
            List of documents
        """
        if self.db is None:
            return []
        
        try:
            query = self.db.collection(self.collection_name).limit(limit)
            docs = query.stream()
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(data)
            
            return results
            
        except Exception as e:
            logger.error(f"Firestore find_all error on {self.collection_name}: {e}")
            return []


# =============================================================================
# Firebase Auth Operations
# =============================================================================

def create_firebase_user(email: str, password: str, display_name: Optional[str] = None) -> Optional[str]:
    """
    Create a new user in Firebase Auth.
    
    Args:
        email: User's email address
        password: User's password
        display_name: Optional display name
        
    Returns:
        Firebase UID on success, None on failure
    """
    auth = get_auth()
    if auth is None:
        logger.error("Firebase Auth not available for user creation")
        return None
    
    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
        )
        logger.info(f"Created Firebase Auth user: {user.uid}")
        return user.uid
        
    except auth.EmailAlreadyExistsError:
        logger.warning(f"Firebase Auth: Email already exists: {email}")
        return None
    except Exception as e:
        logger.error(f"Firebase Auth create_user error: {e}")
        return None


def get_firebase_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get Firebase Auth user by email.
    
    Args:
        email: User's email address
        
    Returns:
        User info dict or None if not found
    """
    auth = get_auth()
    if auth is None:
        return None
    
    try:
        user = auth.get_user_by_email(email)
        return {
            'uid': user.uid,
            'email': user.email,
            'display_name': user.display_name,
            'disabled': user.disabled,
        }
    except auth.UserNotFoundError:
        return None
    except Exception as e:
        logger.error(f"Firebase Auth get_user_by_email error: {e}")
        return None


def verify_firebase_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Firebase ID token (from client-side auth).
    
    Args:
        id_token: Firebase ID token
        
    Returns:
        Decoded token claims or None if invalid
    """
    auth = get_auth()
    if auth is None:
        logger.error("Firebase Auth not available for token verification")
        return None
    
    try:
        # Log token prefix for debugging (first 20 chars only for security)
        token_preview = id_token[:50] + "..." if len(id_token) > 50 else id_token
        logger.debug(f"Verifying Firebase ID token: {token_preview}")
        
        decoded_token = auth.verify_id_token(id_token, check_revoked=True)
        logger.debug(f"Token verified successfully for user: {decoded_token.get('uid', 'unknown')}")
        return decoded_token
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase ID token: {str(e)}")
        return None
    except auth.ExpiredIdTokenError as e:
        logger.warning(f"Expired Firebase ID token: {str(e)}")
        return None
    except auth.RevokedIdTokenError as e:
        logger.warning(f"Revoked Firebase ID token: {str(e)}")
        return None
    except auth.CertificateFetchError as e:
        logger.error(f"Certificate fetch error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Firebase ID token verification error: {type(e).__name__}: {str(e)}")
        return None


def generate_password_reset_link(email: str) -> Optional[str]:
    """
    Generate a password reset link for a user.
    
    Note: Firebase Admin SDK generates the link but doesn't send the email.
    You must send the link to the user yourself.
    
    Args:
        email: User's email address
        
    Returns:
        Password reset link or None on failure
    """
    auth = get_auth()
    if auth is None:
        return None
    
    try:
        link = auth.generate_password_reset_link(email)
        logger.info(f"Generated password reset link for: {email}")
        return link
    except auth.UserNotFoundError:
        logger.warning(f"Password reset: User not found: {email}")
        return None
    except Exception as e:
        logger.error(f"Password reset link generation error: {e}")
        return None
