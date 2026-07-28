# syntax=docker/dockerfile:1.7
FROM python:3.11.15-slim-bookworm@sha256:b18992999dbe963a45a8a4da40ac2b1975be1a776d939d098c647482bcad5cba

LABEL org.opencontainers.image.title="Upadya Backend API" \
      org.opencontainers.image.description="BE1 infrastructure-only FastAPI foundation" \
      org.opencontainers.image.version="0.1.0-be1.3" \
      org.opencontainers.image.base.name="docker.io/library/python:3.11.15-slim-bookworm"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    API_HOST=0.0.0.0 \
    API_PORT=8000 \
    API_WORKERS=1

WORKDIR /app
COPY requirements.lock ./requirements.lock
COPY provenance/wheels/upadya_component_b_live_engine-0.1.0+be3.0e86fdc-py3-none-any.whl ./provenance/wheels/upadya_component_b_live_engine-0.1.0+be3.0e86fdc-py3-none-any.whl
RUN python -m pip install --require-hashes --no-deps -r requirements.lock
RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --create-home --shell /usr/sbin/nologin app
COPY --chown=10001:10001 app ./app
COPY --chown=10001:10001 tests ./tests
COPY --chown=10001:10001 contract ./contract
COPY --chown=10001:10001 pytest.ini ./pytest.ini
COPY --chown=10001:10001 alembic.ini ./alembic.ini
COPY --chown=10001:10001 migrations ./migrations
COPY --chown=10001:10001 provenance/runtime-bundle.schema.json ./provenance/runtime-bundle.schema.json
COPY --chown=10001:10001 provenance/component-b-coverage.json ./provenance/component-b-coverage.json
USER 10001:10001
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
