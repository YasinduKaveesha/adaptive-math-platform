"""Four governance-authorized neutral session-lifecycle endpoints (BE2.3-BE2.4)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request, status

from app.application.b_session_lifecycle import BSessionLifecycleService
from app.domain.b_session import ActiveSessionResponse, SessionCommandResponse
from app.domain.principal import AuthenticatedPrincipal
from app.infrastructure.auth import get_authenticated_principal


router = APIRouter(prefix="/api/v1/b/sessions", tags=["b-session-lifecycle"])


def service() -> BSessionLifecycleService:
    return BSessionLifecycleService()


@router.post("", response_model=SessionCommandResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    request: Request,
    principal: Annotated[AuthenticatedPrincipal, Depends(get_authenticated_principal)],
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=1, max_length=255)],
    use_cases: Annotated[BSessionLifecycleService, Depends(service)],
) -> SessionCommandResponse:
    return await use_cases.start_session(principal, idempotency_key, request.state.request_id)


@router.get("/active", response_model=ActiveSessionResponse)
async def get_active_session(
    request: Request,
    principal: Annotated[AuthenticatedPrincipal, Depends(get_authenticated_principal)],
    use_cases: Annotated[BSessionLifecycleService, Depends(service)],
) -> ActiveSessionResponse:
    return await use_cases.get_active_session(principal, request.state.request_id)


@router.post("/{session_id}/complete", response_model=SessionCommandResponse)
async def complete_session(
    session_id: UUID,
    request: Request,
    principal: Annotated[AuthenticatedPrincipal, Depends(get_authenticated_principal)],
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=1, max_length=255)],
    use_cases: Annotated[BSessionLifecycleService, Depends(service)],
) -> SessionCommandResponse:
    return await use_cases.complete_session(principal, session_id, idempotency_key, request.state.request_id)


@router.post("/{session_id}/abandon", response_model=SessionCommandResponse)
async def abandon_session(
    session_id: UUID,
    request: Request,
    principal: Annotated[AuthenticatedPrincipal, Depends(get_authenticated_principal)],
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=1, max_length=255)],
    use_cases: Annotated[BSessionLifecycleService, Depends(service)],
) -> SessionCommandResponse:
    return await use_cases.abandon_session(principal, session_id, idempotency_key, request.state.request_id)
