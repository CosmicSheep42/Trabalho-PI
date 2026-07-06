from __future__ import annotations

import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.api.deps import get_or_create_current_user
from app.chat.input_cleaner import TextPreprocessorPipeline
from app.chat.runtime_controls import RuntimeControlConfig, RuntimeControls
from app.chat.service import ChatService
from app.core.config import settings
from app.models.user import User
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatSessionClearResponse


router = APIRouter(prefix="/chat", tags=["chat"])

_assets_dir = Path(__file__).resolve().parents[2] / "chat" / "assets"
_input_pipeline = TextPreprocessorPipeline(config=settings.input_cleaner_config())
_runtime_controls = RuntimeControls(
    RuntimeControlConfig(
        max_input_chars=settings.max_input_chars,
        rate_limit_requests=settings.rate_limit_requests,
        rate_limit_window_seconds=settings.rate_limit_window_seconds,
        inference_timeout_seconds=settings.inference_timeout_seconds,
    )
)
_chat_service = ChatService(assets_dir=_assets_dir)


def _resolve_session_id(
    session_id: str | None,
    current_user: User,
) -> str:
    if not session_id or not session_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing session id.")
    return f"{current_user.id}:{session_id.strip()}"


@router.post("", response_model=ChatMessageResponse)
async def chat(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_or_create_current_user),
    x_session_id: str | None = Header(default=None),
) -> ChatMessageResponse:
    is_valid, validation_error = _runtime_controls.validate_input(payload.query)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=validation_error or "Invalid message")

    session_id = _resolve_session_id(x_session_id, current_user)
    allowed, retry_after = _runtime_controls.allow_request(session_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Retry after {retry_after:.0f} seconds.",
        )

    cleaned_query = _input_pipeline.process_for_chat(payload.query)
    if not cleaned_query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is empty after preprocessing")

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(_chat_service.chat, session_id, current_user.id, cleaned_query),
            timeout=settings.inference_timeout_seconds,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Inference timed out.") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return ChatMessageResponse(
        result=result.content,
        tool_calls=result.tool_calls,
        executed_tool_calls=result.executed_tool_calls,
    )


@router.delete("/session", response_model=ChatSessionClearResponse)
def clear_chat_session(
    current_user: User = Depends(get_or_create_current_user),
    x_session_id: str | None = Header(default=None),
) -> ChatSessionClearResponse:
    session_id = _resolve_session_id(x_session_id, current_user)
    _chat_service.clear_session(session_id)
    return ChatSessionClearResponse(success=True)
