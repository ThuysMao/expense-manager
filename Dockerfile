FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Change working directory to backend
WORKDIR /app/backend

# Set environment variables
ENV FLASK_ENV=production
ENV DB_PATH=/data/expense_manager.db

# Expose port
EXPOSE 8080

# Run with gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "server:app"]
