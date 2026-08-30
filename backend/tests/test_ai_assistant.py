import os
import sys
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
import httpx

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_ai_assistant_validation_empty_message():
    """Test that empty or whitespace message returns 422 Unprocessable Entity."""
    response = client.post("/ai/assistant", json={"message": "", "language": "en"})
    assert response.status_code == 422

    response_ws = client.post("/ai/assistant", json={"message": "   ", "language": "en"})
    assert response_ws.status_code == 422


def test_ai_assistant_validation_invalid_language():
    """Test that unsupported language code returns 422 Unprocessable Entity."""
    response = client.post("/ai/assistant", json={"message": "Hello", "language": "fr"})
    assert response.status_code == 422


def test_ai_assistant_missing_api_key():
    """Test that missing SARVAM_API_KEY returns a clean 503 error without crashing."""
    with patch.object(settings, "SARVAM_API_KEY", ""):
        response = client.post("/ai/assistant", json={"message": "What is Crisis Connect?", "language": "en"})
        assert response.status_code == 503
        data = response.json()
        assert "detail" in data
        assert "SARVAM_API_KEY" not in str(data)  # No secret or internal variable leakage


def test_ai_assistant_english_success():
    """Test successful English assistant response."""
    mock_sarvam_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Crisis Connect is an emergency response platform designed for real-time disaster coordination and citizen safety.",
                }
            }
        ]
    }

    mock_resp = httpx.Response(200, json=mock_sarvam_response, request=httpx.Request("POST", "https://api.sarvam.ai/v1/chat/completions"))

    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/assistant",
            json={"message": "What is Crisis Connect?", "language": "en"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "Crisis Connect" in data["response"]
        assert "test-mock-key" not in str(data)


def test_ai_assistant_hindi_success():
    """Test successful Hindi assistant response."""
    mock_sarvam_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "क्राइसिस कनेक्ट एक आपदा प्रबंधन और आपातकालीन सहायता मंच है।",
                }
            }
        ]
    }

    mock_resp = httpx.Response(200, json=mock_sarvam_response, request=httpx.Request("POST", "https://api.sarvam.ai/v1/chat/completions"))

    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/assistant",
            json={"message": "क्राइसिस कनेक्ट क्या है?", "language": "hi"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "क्राइसिस कनेक्ट" in data["response"]


def test_ai_assistant_kannada_success():
    """Test successful Kannada assistant response."""
    mock_sarvam_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್ ಎಂಬುದು ನೈಜ-ಸಮಯದ ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ ವೇದಿಕೆಯಾಗಿದೆ.",
                }
            }
        ]
    }

    mock_resp = httpx.Response(200, json=mock_sarvam_response, request=httpx.Request("POST", "https://api.sarvam.ai/v1/chat/completions"))

    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/assistant",
            json={"message": "ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್ ಎಂದರೇನು?", "language": "ka"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್" in data["response"]


def test_ai_assistant_auto_detect_hindi_script_when_default_en():
    """Test that Devanagari Hindi text automatically triggers Hindi system prompt even if client sends default en."""
    mock_sarvam_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "क्राइसिस कनेक्ट में आपका स्वागत है।",
                }
            }
        ]
    }
    mock_resp = httpx.Response(200, json=mock_sarvam_response, request=httpx.Request("POST", "https://api.sarvam.ai/v1/chat/completions"))

    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/assistant",
            json={"message": "क्राइसिस कनेक्ट क्या है?", "language": "en"},
        )

        assert response.status_code == 200
        # Verify the system prompt sent to Sarvam requested Hindi
        call_kwargs = mock_post.call_args[1]
        payload = call_kwargs["json"]
        system_content = payload["messages"][0]["content"]
        assert "Hindi (हिन्दी)" in system_content


def test_ai_assistant_auto_detect_kannada_script_when_default_en():
    """Test that Kannada script automatically triggers Kannada system prompt even if client sends default en."""
    mock_sarvam_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್‌ಗೆ ಸುಸ್ವಾಗತ.",
                }
            }
        ]
    }
    mock_resp = httpx.Response(200, json=mock_sarvam_response, request=httpx.Request("POST", "https://api.sarvam.ai/v1/chat/completions"))

    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/assistant",
            json={"message": "ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್ ಎಂದರೇನು?", "language": "en"},
        )

        assert response.status_code == 200
        call_kwargs = mock_post.call_args[1]
        payload = call_kwargs["json"]
        system_content = payload["messages"][0]["content"]
        assert "Kannada (ಕನ್ನಡ)" in system_content


def test_ai_assistant_timeout_handling():
    """Test that upstream Sarvam timeout returns 504 Gateway Timeout."""
    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Timeout")

        response = client.post(
            "/ai/assistant",
            json={"message": "How to report SOS?", "language": "en"},
        )

        assert response.status_code == 504
        data = response.json()
        assert "detail" in data
        assert "timed out" in data["detail"].lower()


def test_ai_assistant_auth_failure_handling():
    """Test that Sarvam 401 returns 502 Bad Gateway without exposing secret."""
    mock_resp = httpx.Response(
        401,
        json={"error": "Unauthorized subscription key"},
        request=httpx.Request("POST", "https://api.sarvam.ai/v1/chat/completions"),
    )

    with patch.object(settings, "SARVAM_API_KEY", "invalid-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/assistant",
            json={"message": "Hello", "language": "en"},
        )

        assert response.status_code == 502
        data = response.json()
        assert "invalid-key" not in str(data)


def test_speech_to_text_success():
    """Test successful Saaras v3 transcription endpoint."""
    mock_stt_response = {
        "request_id": "test-req-id",
        "transcript": "How does emergency SOS work?",
        "language_code": "en-IN",
    }
    mock_resp = httpx.Response(
        200,
        json=mock_stt_response,
        request=httpx.Request("POST", "https://api.sarvam.ai/speech-to-text"),
    )

    fake_wav_bytes = b"RIFFfake_wav_data"
    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/speech-to-text",
            files={"file": ("test.wav", fake_wav_bytes, "audio/wav")},
            data={"language": "en"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["transcript"] == "How does emergency SOS work?"
        assert data["language_code"] == "en-IN"


def test_speech_to_text_codemix_hindi():
    """Test Saaras v3 transcription with Hindi code-mixed audio."""
    mock_stt_response = {
        "request_id": "test-req-id-hi",
        "transcript": "Emergency SOS kaise kaam karta hai?",
        "language_code": "hi-IN",
    }
    mock_resp = httpx.Response(
        200,
        json=mock_stt_response,
        request=httpx.Request("POST", "https://api.sarvam.ai/speech-to-text"),
    )

    fake_wav_bytes = b"RIFFfake_wav_data"
    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/speech-to-text",
            files={"file": ("test.wav", fake_wav_bytes, "audio/wav")},
            data={"language": "hi"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "Emergency SOS" in data["transcript"]


def test_text_to_speech_success():
    """Test successful Bulbul v3 TTS synthesis."""
    mock_tts_response = {
        "request_id": "test-tts-req",
        "audios": ["UklGRtest_base64_audio_data=="],
    }
    mock_resp = httpx.Response(
        200,
        json=mock_tts_response,
        request=httpx.Request("POST", "https://api.sarvam.ai/text-to-speech"),
    )

    with patch.object(settings, "SARVAM_API_KEY", "test-mock-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        response = client.post(
            "/ai/text-to-speech",
            json={"text": "Crisis Connect is active.", "language": "en"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["audio_base64"] == "UklGRtest_base64_audio_data=="
        assert data["content_type"] == "audio/wav"


def test_text_to_speech_validation_empty_text():
    """Test that empty text returns 422 error."""
    response = client.post(
        "/ai/text-to-speech",
        json={"text": "   ", "language": "en"},
    )
    assert response.status_code == 422

