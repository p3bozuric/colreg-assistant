# Change this line
FROM python:3.12-slim

# Rest remains the same
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir pipenv

COPY backend/Pipfile backend/Pipfile.lock ./

RUN pipenv install --system --deploy

COPY backend/ .

EXPOSE 5000

CMD ["python", "app.py"]