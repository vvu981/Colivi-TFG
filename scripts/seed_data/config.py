#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
config.py — Global configuration and constants for Colivi QA Seeder
"""

import os
import sys

# Forzar encoding UTF-8 en stdout/stderr para compatibilidad con Windows cp1252
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ── Configuración de Conexión ──────────────────────────────────────────
BASE_URL = os.environ.get("COLIVI_API_URL", "http://localhost:8080").rstrip("/")
REQUEST_TIMEOUT = int(os.environ.get("COLIVI_REQUEST_TIMEOUT", "30"))

# ── Directorios del Proyecto ───────────────────────────────────────────
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))
IMGS_DIR = os.path.join(PROJECT_ROOT, "imgs_prueba")

# ── Comodidades Soportadas en Colivi ───────────────────────────────────
ALL_AMENITIES = [
    "WIFI",
    "HEATING",
    "AIR_CONDITIONING",
    "PETS_ALLOWED",
    "ELEVATOR",
    "BALCONY",
    "PARKING",
    "WASHING_MACHINE",
    "DISHWASHER",
    "TERRACE",
    "SWIMMING_POOL",
    "WORK_ZONE",
    "SMOKING_ALLOWED",
]

# ── Tipos de Alquiler ──────────────────────────────────────────────────
RENTAL_TYPE_ROOM = "ROOM"
RENTAL_TYPE_ENTIRE = "ENTIRE_PLACE"

# ── Motivos de Denuncia ───────────────────────────────────────────────
REPORT_REASONS = [
    "SPAM",
    "FRAUD",
    "HARASSMENT",
    "INAPPROPRIATE_CONTENT",
    "OTHER",
]

# ── Estados de Solicitud de Reserva ───────────────────────────────────
BOOKING_STATUS_PENDING = "PENDING"
BOOKING_STATUS_ACCEPTED = "ACCEPTED"
BOOKING_STATUS_REJECTED = "REJECTED"
BOOKING_STATUS_CANCELLED = "CANCELLED"
BOOKING_STATUS_CONFIRMED = "CONFIRMED"
