#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
seed_messages_only.py — Standalone Runner to Populate High-Density Messages & Conversations
=============================================================================================
Inicia sesión con los usuarios existentes, consulta los anuncios y reservas actuales
y ejecuta el seeder de mensajería contextual para poblar decenas de conversaciones y mensajes.
"""

import base64
import json
import os
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from seed_data.api_client import ApiClient, get_database_table_counts
from seed_data.config import BASE_URL
from seed_data.data_fixtures import ADMIN_USERS, USERS_DATA
from seed_data.seeders.message_seeder import seed_messages_and_conversations


def get_user_id_from_jwt(token: str) -> str:
    """Extrae el UUID del usuario directamente del payload del JWT sin overhead de red."""
    if not token or "." not in token:
        return ""
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.b64decode(payload_b64))
        return payload.get("id", "")
    except Exception:
        return ""


def main():
    print("=" * 80)
    print("   COLIVI — GENERACIÓN DE CONVERSACIONES Y MENSAJES DE ALTA DENSIDAD")
    print("=" * 80)

    client = ApiClient(base_url=BASE_URL)
    if not client.check_health():
        print(f"[!] ERROR: No se puede conectar con el backend en {client.base_url}")
        sys.exit(1)

    print("\n[1/3] Autenticando usuarios del catálogo para obtener Bearer tokens...")
    users_by_email = {}
    users_list = []

    # Autenticar administradores
    for adm in ADMIN_USERS:
        try:
            res = client.post("/api/v1/auth/login", {"email": adm["email"], "password": adm["password"]}, expected=200)
            token = res.get("accessToken")
            uid = get_user_id_from_jwt(token)
            user_obj = {
                "id": uid,
                "email": adm["email"],
                "firstName": adm["firstName"],
                "lastName1": adm["lastName1"],
                "nickname": adm["nickname"],
                "token": token,
                "role": "ADMIN",
            }
            users_by_email[adm["email"]] = user_obj
            users_list.append(user_obj)
        except Exception:
            pass

    # Autenticar usuarios regulares
    for u in USERS_DATA:
        try:
            res = client.post("/api/v1/auth/login", {"email": u["email"], "password": u["password"]}, expected=200)
            token = res.get("accessToken")
            uid = get_user_id_from_jwt(token)
            user_obj = {
                "id": uid,
                "email": u["email"],
                "firstName": u["firstName"],
                "lastName1": u["lastName1"],
                "nickname": u["nickname"],
                "token": token,
                "city": u.get("city", "Madrid"),
                "role": "USER",
            }
            users_by_email[u["email"]] = user_obj
            users_list.append(user_obj)
        except Exception:
            pass

    print(f"  [+] {len(users_list)} usuarios autenticados correctamente.")

    # Consultar anuncios desde la API pública
    print("\n[2/3] Obteniendo catálogo de anuncios y solicitudes de reserva...")
    listings = []
    page = 0
    while True:
        try:
            res = client.get("/api/v1/listings", params={"page": page, "size": 50}, expected=200)
            content = res.get("content", [])
            for item in content:
                host_id = item.get("hostId") or item.get("host_id")
                listings.append({
                    "id": item["id"],
                    "title": item["title"],
                    "pricePerMonth": item.get("pricePerMonth"),
                    "host_id": host_id,
                })
            if res.get("last", True) or not content:
                break
            page += 1
        except Exception as e:
            print(f"  [!] Error al paginar anuncios: {e}")
            break

    print(f"  [+] {len(listings)} anuncios recuperados del sistema.")

    # Obtener solicitudes de reserva consultando por cada inquilino
    bookings = []
    for u in users_list:
        try:
            res = client.get("/api/v1/booking-requests/tenant", token=u["token"], expected=200)
            content = res.get("content", [])
            for b in content:
                bookings.append({
                    "id": b["id"],
                    "listing_id": b.get("accommodationListingId"),
                    "requester_id": u["id"],
                    "requester_email": u["email"],
                    "status": b.get("status"),
                })
        except Exception:
            pass

    print(f"  [+] {len(bookings)} reservas vinculadas recuperadas.")

    # Ejecutar seeder de mensajería
    print("\n[3/3] Ejecutando seeder de mensajería contextual y consultas...")
    start_time = time.time()
    convs_count, msgs_count = seed_messages_and_conversations(
        client=client,
        users=users_list,
        listings=listings,
        bookings=bookings,
        users_by_email=users_by_email,
    )
    elapsed = time.time() - start_time

    # Mostrar reporte final
    db_counts = get_database_table_counts()
    print("\n" + "=" * 80)
    print("                 ESTADO FINAL DE TABLAS TRAS EL SEEDING")
    print("=" * 80)
    print(f"  • Tiempo: {elapsed:.1f} segundos")
    print(f"  • Conversaciones en DB: {db_counts.get('conversations', convs_count)} filas")
    print(f"  • Mensajes en DB:       {db_counts.get('messages', msgs_count)} filas")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
