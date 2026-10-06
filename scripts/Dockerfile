FROM python:3.11-alpine

# Instalar cliente PostgreSQL para utilidades de base de datos
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Instalar dependencias Python
COPY scripts/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copiar scripts e imagenes de prueba
COPY scripts /app/scripts
COPY imgs_prueba /app/imgs_prueba

ENV PYTHONUNBUFFERED=1
ENV IN_DOCKER=true

CMD ["python", "scripts/seed_qa_data.py", "--skip-wipe"]
