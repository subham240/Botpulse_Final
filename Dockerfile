FROM python:3.11-slim

# Install system dependencies including OpenMP for XGBoost
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and configuration
COPY backend/ ./backend/

# Copy pre-built frontend distribution
COPY dist/ ./dist/

EXPOSE 8000

ENV PORT=8000
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
