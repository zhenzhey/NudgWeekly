FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# Use shell form so $PORT env var (injected by Railway) is expanded at runtime.
# Falls back to 8000 for local Docker usage.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
