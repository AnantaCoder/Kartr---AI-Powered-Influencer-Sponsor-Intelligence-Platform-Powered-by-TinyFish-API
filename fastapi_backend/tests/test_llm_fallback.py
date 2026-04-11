import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import analysis_service
from config import settings

class TestLLMFallback(unittest.TestCase):
    
    @patch('services.analysis_service.genai')
    @patch('services.analysis_service.OpenAI')
    @patch('services.analysis_service.settings')
    def test_fallback_logic(self, mock_settings, mock_openai, mock_genai):
        """
        Test that Grok is called when Gemini fails.
        """
        print("\n[TEST] Testing Fallback Logic...")
        
        # Setup Mocks
        mock_settings.GEMINI_API_KEY = "fake_gemini_key"
        mock_settings.GEMINI_TEXT_MODEL = "gemini-flash"
        mock_settings.GROK_API_KEY = "fake_grok_key"
        mock_settings.GROK_MODEL = "grok-2"
        
        # 1. Mock Gemini Failure
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("Gemini Service Unavailable")
        mock_genai.GenerativeModel.return_value = mock_model
        
        # 2. Mock Grok Success
        mock_grok_client = MagicMock()
        mock_chat_compl = MagicMock()
        mock_message = MagicMock()
        mock_message.message.content = '{"result": "Grok Response"}'
        mock_chat_compl.choices = [mock_message]
        mock_grok_client.chat.completions.create.return_value = mock_chat_compl
        mock_openai.return_value = mock_grok_client

        # Force available flags to True for test
        analysis_service.GEMINI_AVAILABLE = True
        analysis_service.OPENAI_AVAILABLE = True

        # Run Method
        result = analysis_service._generate_with_fallback("Test Prompt")
        
        # Verify
        print(f"[RESULT] Received: {result}")
        
        # Assertions
        self.assertEqual(result, '{"result": "Grok Response"}')
        print("[CHECK] Gemini was called? Yes")
        # Ensure Gemini was attempted
        mock_model.generate_content.assert_called_once()
        print("[CHECK] Grok was called? Yes")
        # Ensure Grok was called
        mock_openai.assert_called()
        
        print("[SUCCESS] Fallback worked correctly!")

if __name__ == '__main__':
    unittest.main()
