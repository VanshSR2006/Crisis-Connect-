from typing import Literal, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from pydantic import BaseModel, Field, field_validator
from ..services.sarvam_service import sarvam_service
from ..core.rate_limiter import RateLimiter
from ..core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class AssistantRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User question, query, or command to the AI assistant.",
        json_schema_extra={"example": "How does Emergency SOS work?"},
    )
    language: Literal["en", "hi", "ka"] = Field(
        default="en",
        description="Target response language code ('en', 'hi', or 'ka').",
        json_schema_extra={"example": "en"},
    )

    @field_validator("message")
    @classmethod
    def validate_message_not_blank(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Message cannot be empty or only whitespace.")
        return trimmed


class AssistantResponse(BaseModel):
    response: str = Field(
        ...,
        description="The AI-generated assistant response text.",
        json_schema_extra={
            "example": "Emergency SOS lets you instantly broadcast distress signals with your GPS location to emergency responders."
        },
    )


class SpeechToTextResponse(BaseModel):
    transcript: str = Field(
        ...,
        description="Transcribed text from user audio recording.",
        json_schema_extra={"example": "Emergency SOS kaise kaam karta hai?"},
    )
    language_code: Optional[str] = Field(
        default="en-IN",
        description="Detected language code from Sarvam Saaras v3.",
        json_schema_extra={"example": "hi-IN"},
    )


class TextToSpeechRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Text to synthesize into natural voice audio.",
        json_schema_extra={"example": "Emergency SOS broadcast has been sent."},
    )
    language: Literal["en", "hi", "ka"] = Field(
        default="en",
        description="Target language code for voice synthesis.",
        json_schema_extra={"example": "en"},
    )
    speaker: Optional[str] = Field(
        default="shubh",
        description="Sarvam Bulbul v3 speaker voice identity.",
        json_schema_extra={"example": "shubh"},
    )

    @field_validator("text")
    @classmethod
    def validate_text_not_blank(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Text cannot be empty or only whitespace.")
        return trimmed


class TextToSpeechResponse(BaseModel):
    audio_base64: str = Field(
        ...,
        description="Base64-encoded audio bytes for browser playback.",
    )
    content_type: str = Field(
        default="audio/wav",
        description="MIME content type of the generated voice audio.",
        json_schema_extra={"example": "audio/wav"},
    )


@router.post(
    "/assistant",
    response_model=AssistantResponse,
    status_code=status.HTTP_200_OK,
    summary="Crisis Connect AI Voice & Text Assistant",
    description="Processes user questions regarding Crisis Connect platform features, login guidance, and disaster safety in English, Hindi, or Kannada using Sarvam AI conversational model.",
)
async def chat_with_assistant(
    request: AssistantRequest,
    _limiter: None = Depends(RateLimiter(times=settings.RATE_LIMIT_AI, seconds=settings.RATE_LIMIT_WINDOW_SECONDS, key_prefix="ai_assistant")),
) -> AssistantResponse:
    """
    Public conversational AI assistant endpoint.
    Processes user queries and returns clear, localized responses.
    """
    reply_text = await sarvam_service.generate_response(
        message=request.message,
        language=request.language,
    )

    return AssistantResponse(response=reply_text)


@router.post(
    "/speech-to-text",
    response_model=SpeechToTextResponse,
    status_code=status.HTTP_200_OK,
    summary="Sarvam Saaras v3 Speech-to-Text Transcription",
    description="Accepts browser-recorded audio and transcribes it using Sarvam Saaras v3 in codemix mode (supporting English, Hindi, and Kannada).",
)
async def speech_to_text(
    file: UploadFile = File(...),
    language: Optional[Literal["en", "hi", "ka"]] = Form(default=None),
    _limiter: None = Depends(RateLimiter(times=settings.RATE_LIMIT_AI, seconds=settings.RATE_LIMIT_WINDOW_SECONDS, key_prefix="ai_stt")),
) -> SpeechToTextResponse:
    """
    Public audio transcription endpoint. Converts user voice note / speech to text.
    """
    audio_bytes = await file.read()
    filename = file.filename or "audio.wav"
    content_type = file.content_type or "audio/wav"

    result = await sarvam_service.speech_to_text(
        audio_bytes=audio_bytes,
        filename=filename,
        content_type=content_type,
        language=language,
    )

    return SpeechToTextResponse(
        transcript=result["transcript"],
        language_code=result.get("language_code", language or "en-IN"),
    )


@router.post(
    "/text-to-speech",
    response_model=TextToSpeechResponse,
    status_code=status.HTTP_200_OK,
    summary="Sarvam Bulbul v3 Text-to-Speech Audio Synthesis",
    description="Converts assistant text response to high quality speech audio using Sarvam Bulbul v3.",
)
async def text_to_speech(
    request: TextToSpeechRequest,
    _limiter: None = Depends(RateLimiter(times=settings.RATE_LIMIT_AI, seconds=settings.RATE_LIMIT_WINDOW_SECONDS, key_prefix="ai_tts")),
) -> TextToSpeechResponse:
    """
    Public text-to-speech synthesis endpoint.
    """
    result = await sarvam_service.text_to_speech(
        text=request.text,
        language=request.language,
        speaker=request.speaker or "shubh",
    )

    return TextToSpeechResponse(
        audio_base64=result["audio_base64"],
        content_type=result.get("content_type", "audio/wav"),
    )

