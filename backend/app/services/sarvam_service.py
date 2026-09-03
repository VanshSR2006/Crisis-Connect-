import re
import logging
from typing import Dict, Any, Optional
import httpx
from fastapi import HTTPException, status
from ..core.config import settings
from .ai_knowledge import build_system_prompt, CRISIS_CONNECT_KNOWLEDGE_PROMPT

logger = logging.getLogger(__name__)

SARVAM_CHAT_COMPLETIONS_URL = "https://api.sarvam.ai/v1/chat/completions"
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
DEFAULT_TIMEOUT_SECONDS = 30.0

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "ka": "Kannada (ಕನ್ನಡ)",
}

SARVAM_TTS_LANGUAGE_CODES = {
    "en": "en-IN",
    "hi": "hi-IN",
    "ka": "kn-IN",
}

SARVAM_STT_LANGUAGE_CODES = {
    "en": "en-IN",
    "hi": "hi-IN",
    "ka": "kn-IN",
}

SYSTEM_PROMPT_TEMPLATE = build_system_prompt("{language_name}")



def detect_language(message: str, fallback_language: str = "en") -> str:
    """
    Detects language from message content (Devanagari -> hi, Kannada -> ka, Romanized keywords)
    or falls back to the requested UI fallback language.
    """
    if not message:
        return fallback_language if fallback_language in ("en", "hi", "ka") else "en"

    # 1. Unicode script detection (100% deterministic for native scripts)
    for char in message:
        code = ord(char)
        if 0x0900 <= code <= 0x097F:  # Devanagari Unicode range
            return "hi"
        if 0x0C80 <= code <= 0x0CFF:  # Kannada Unicode range
            return "ka"

    msg_lower = message.lower()

    # 2. Kannada keywords & phrases
    kannada_patterns = [
        r"\bkannada\b", r"\bkannadadalli\b", r"\bkannadalli\b", r"\byenu\b", r"\benu\b",
        r"\bhege\b", r"\bbeku\b", r"\bnamaskara\b", r"\bdhanyavada\b", r"\bdayavittu\b",
        r"\byelli\b", r"\belli\b", r"\bhogi\b", r"\bbanni\b", r"\baguthe\b", r"\bhosa\b",
        r"\bandre\b", r"\bandare\b", r"\bheli\b", r"\byavaga\b"
    ]
    if any(re.search(pat, msg_lower) for pat in kannada_patterns):
        return "ka"

    # 3. Hindi keywords & phrases
    hindi_patterns = [
        r"\bhindi\b", r"\bkya\b", r"\bkaise\b", r"\bbatao\b", r"\bbataiye\b",
        r"\bmadad\b", r"\bkripya\b", r"\bnamaste\b", r"\bmujhe\b", r"\bchahiye\b",
        r"\bkarna\b", r"\bkaren\b", r"\bshukriya\b", r"\bdhanyawad\b", r"\bbaare\b",
        r"\bsamjhao\b", r"\bhain\b", r"\bhai\b", r"\bhota\b", r"\bhoti\b"
    ]
    if any(re.search(pat, msg_lower) for pat in hindi_patterns):
        return "hi"

    return fallback_language if fallback_language in ("en", "hi", "ka") else "en"


class SarvamService:
    def __init__(self):
        self.chat_url = SARVAM_CHAT_COMPLETIONS_URL
        self.stt_url = SARVAM_STT_URL
        self.tts_url = SARVAM_TTS_URL
        self.timeout = DEFAULT_TIMEOUT_SECONDS

    def _get_api_key(self) -> str:
        key = settings.SARVAM_API_KEY.strip() if settings.SARVAM_API_KEY else ""
        if not key:
            logger.warning("[SarvamService] SARVAM_API_KEY is not configured.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI Assistant service is currently not configured on this server.",
            )
        return key

    async def generate_response(self, message: str, language: str = "en") -> str:
        """
        Sends a user prompt to Sarvam conversational AI (sarvam-105b-conversations)
        and returns the assistant's text response.
        """
        api_key = self._get_api_key()
        
        # Auto-detect language from prompt script/content or fallback to specified language
        lang_code = detect_language(message, fallback_language=language.lower() if language else "en")
        language_name = LANGUAGE_NAMES.get(lang_code, "English")

        system_prompt = build_system_prompt(language_name=language_name)

        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": api_key,
        }

        payload: Dict[str, Any] = {
            "model": settings.SARVAM_MODEL or "sarvam-105b-conversations",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": 0.3,
            "max_tokens": 450,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.chat_url,
                    headers=headers,
                    json=payload,
                )

                if response.status_code in (401, 403):
                    logger.error("[SarvamService] Authentication failed with Sarvam API.")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="AI Assistant service authentication failed.",
                    )
                
                if response.status_code == 429:
                    logger.warning("[SarvamService] Rate limited by Sarvam API.")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="AI Assistant is experiencing high traffic. Please try again shortly.",
                    )

                response.raise_for_status()
                data = response.json()

        except httpx.TimeoutException:
            logger.error(f"[SarvamService] Request to Sarvam timed out after {self.timeout}s.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI Assistant service request timed out.",
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"[SarvamService] HTTP status error from Sarvam: {e.response.status_code}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI Assistant provider returned an error.",
            )
        except httpx.RequestError as e:
            logger.error(f"[SarvamService] Network error connecting to Sarvam API: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to reach AI Assistant service.",
            )

        # Parse response safely
        try:
            choices = data.get("choices", [])
            if not choices or not isinstance(choices, list):
                raise ValueError("No choices in response")
            
            message_obj = choices[0].get("message", {})
            content = message_obj.get("content", "").strip()
            
            if not content:
                raise ValueError("Empty content in response choice")

            return content

        except Exception as parse_err:
            logger.error(f"[SarvamService] Failed to parse Sarvam response: {parse_err}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Received invalid response format from AI service.",
            )

    async def speech_to_text(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        content_type: str = "audio/wav",
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribes user speech using Sarvam Saaras v3 (/speech-to-text).
        Supports code-mixed speech across English, Hindi, and Kannada.
        """
        api_key = self._get_api_key()

        files = {
            "file": (filename if filename.endswith(".wav") else "audio.wav", audio_bytes, "audio/wav"),
        }
        data: Dict[str, str] = {
            "model": "saaras:v3",
            "mode": "codemix",
        }

        if language:
            mapped_lang = SARVAM_STT_LANGUAGE_CODES.get(language.lower())
            if mapped_lang:
                data["language_code"] = mapped_lang

        headers = {
            "api-subscription-key": api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.stt_url,
                    headers=headers,
                    files=files,
                    data=data,
                )

                if response.status_code in (401, 403):
                    logger.error("[SarvamService] Authentication failed with Sarvam STT.")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Speech-to-text service authentication failed.",
                    )
                if response.status_code == 429:
                    logger.warning("[SarvamService] Rate limited by Sarvam STT.")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Speech-to-text service is busy. Please try again shortly.",
                    )

                if not response.is_success:
                    logger.error(f"[SarvamService] STT error {response.status_code}: {response.text}")

                response.raise_for_status()
                res_data = response.json()

        except httpx.TimeoutException:
            logger.error(f"[SarvamService] STT request timed out after {self.timeout}s.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Speech-to-text service timed out.",
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"[SarvamService] STT HTTP error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Speech-to-text provider returned an error.",
            )
        except httpx.RequestError as e:
            logger.error(f"[SarvamService] STT network error: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to reach speech-to-text service.",
            )

        transcript = res_data.get("transcript", "").strip()
        detected_lang = res_data.get("language_code", language or "en-IN")

        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No clear speech detected in audio.",
            )

        return {
            "transcript": transcript,
            "language_code": detected_lang,
        }

    async def text_to_speech(
        self,
        text: str,
        language: str = "en",
        speaker: str = "shubh",
    ) -> Dict[str, Any]:
        """
        Converts AI assistant text response to speech audio using Sarvam Bulbul v3 (/text-to-speech).
        Returns base64 encoded audio with MIME type.
        """
        api_key = self._get_api_key()
        clean_text = text.strip()
        if not clean_text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Text cannot be empty.",
            )

        # Truncate to maximum characters safely if too long
        if len(clean_text) > 2000:
            clean_text = clean_text[:2000]

        detected_lang = detect_language(clean_text, fallback_language=language.lower() if language else "en")
        target_lang = SARVAM_TTS_LANGUAGE_CODES.get(detected_lang, "en-IN")

        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": api_key,
        }

        payload: Dict[str, Any] = {
            "inputs": [clean_text],
            "target_language_code": target_lang,
            "model": "bulbul:v3",
            "speaker": speaker,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.tts_url,
                    headers=headers,
                    json=payload,
                )

                if response.status_code in (401, 403):
                    logger.error("[SarvamService] Authentication failed with Sarvam TTS.")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Text-to-speech service authentication failed.",
                    )
                if response.status_code == 429:
                    logger.warning("[SarvamService] Rate limited by Sarvam TTS.")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Text-to-speech service is busy. Please try again shortly.",
                    )

                response.raise_for_status()
                res_data = response.json()

        except httpx.TimeoutException:
            logger.error(f"[SarvamService] TTS request timed out after {self.timeout}s.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Text-to-speech service timed out.",
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"[SarvamService] TTS HTTP error: {e.response.status_code}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Text-to-speech provider returned an error.",
            )
        except httpx.RequestError as e:
            logger.error(f"[SarvamService] TTS network error: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to reach text-to-speech service.",
            )

        audios = res_data.get("audios", [])
        if not audios or not isinstance(audios, list) or not audios[0]:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Text-to-speech provider did not return audio data.",
            )

        return {
            "audio_base64": audios[0],
            "content_type": "audio/wav",
        }


sarvam_service = SarvamService()
