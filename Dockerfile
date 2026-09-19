# Builds the Django backend for platforms that deploy directly from a
# Dockerfile (Kuberns, etc.) rather than auto-detecting a buildpack.
# Lives at the repo root (not backend/) so it builds correctly even on
# platforms without a "root directory" / monorepo setting — it just COPYs
# the backend/ subdirectory itself.

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# collectstatic only needs Django to import cleanly — it never touches
# MongoDB or signs anything — but settings.py requires MONGO_URI to be
# set at all (see common/mongo_base.py) and SECRET_KEY to be non-empty.
# These placeholders are baked into this build layer only; the platform's
# real environment variables at runtime override them.
ENV SECRET_KEY=build-time-placeholder \
    MONGO_URI=mongodb://localhost:27017/placeholder \
    MONGO_DB_NAME=placeholder
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
