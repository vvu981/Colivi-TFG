#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
seed_qa_data.py — Colivi QA Database Reset & High-Density Seeding Automation
=============================================================================
Script automatizado para pruebas de QA, testing funcional, auditoría y demostración:

1. Resetea la base de datos (TRUNCATE CASCADE).
2. Registra 2 Administradores y 50 Usuarios con perfiles reales, bios y avatares.
3. Crea 36 Alojamientos en 11 ciudades con clusters reales de coordenadas para mapas.
4. Sube fotos de /imgs_prueba y publica 55+ anuncios (ROOM y ENTIRE_PLACE).
5. Genera 80+ solicitudes de reserva con ciclo de vida completo (PENDING, ACCEPTED, CONFIRMED, etc.).
6. Publica 40+ reseñas verificadas vinculadas a estancias reales con notas de 1 a 5 estrellas.
7. Crea 10 Hogares de convivencia con miembros unidos por código de invitación.
8. Registra 60+ Gastos del hogar con repartos y 25+ Pagos directos entre convivientes.
9. Genera 18+ Denuncias de moderación con resoluciones administrativas y feedback.
10. Simula 100+ Búsquedas de usuarios para analítica e historial de recomendaciones.

Uso:
    python scripts/seed_qa_data.py
    python scripts/seed_qa_data.py --skip-wipe
"""

import argparse
import glob
import os
import random
import sys
import time

# Forzar encoding UTF-8 en stdout/stderr para compatibilidad con Windows cp1252
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ajuste de path para importar el paquete seed_data
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from seed_data.api_client import ApiClient, get_database_table_counts, wipe_database
from seed_data.config import BASE_URL, IMGS_DIR
from seed_data.data_fixtures import ACCOMMODATIONS_LOCATIONS, ADMIN_USERS, USERS_DATA
from seed_data.seeders.accommodation_seeder import seed_accommodations_and_listings
from seed_data.seeders.booking_seeder import seed_bookings_and_reviews
from seed_data.seeders.chore_seeder import seed_chores
from seed_data.seeders.home_seeder import seed_homes_expenses_and_payments
from seed_data.seeders.message_seeder import seed_messages_and_conversations
from seed_data.seeders.report_seeder import seed_reports_and_moderation
from seed_data.seeders.search_seeder import seed_search_histories
from seed_data.seeders.user_seeder import seed_users


def load_images() -> list[str]:
    """Carga y valida las imágenes disponibles en el directorio imgs_prueba."""
    if not os.path.isdir(IMGS_DIR):
        print(f"  [!] Advertencia: No se encontró el directorio de imágenes: {IMGS_DIR}")
        return []

    images = (
        glob.glob(os.path.join(IMGS_DIR, "*.jpeg"))
        + glob.glob(os.path.join(IMGS_DIR, "*.jpg"))
        + glob.glob(os.path.join(IMGS_DIR, "*.png"))
    )
    random.shuffle(images)
    return images


def print_summary(
    admins: dict,
    users: list,
    accommodations: list,
    listings: list,
    bookings: list,
    reviews_count: int,
    conversations_count: int,
    messages_count: int,
    homes: list,
    expenses_count: int,
    payments_count: int,
    chores_count: int,
    reports_count: int,
    searches_count: int,
    elapsed_time: float,
):
    """Muestra un resumen visual, estructurado y profesional con conteos en base de datos."""
    print("\n" + "=" * 80)
    print("        COLIVI QA SEEDING — REPORTE DE POBLACIÓN DE ALTA DENSIDAD")
    print("=" * 80)
    print(f"  Tiempo total de ejecución: {elapsed_time:.1f} segundos\n")

    # Obtener conteos directos de PostgreSQL
    db_counts = get_database_table_counts()

    print("  RECUENTO EXACTO DE FILAS EN TABLAS DE POSTGRESQL:")
    print("  " + "─" * 60)
    for tbl, count in db_counts.items():
        print(f"  • {tbl:<30} {count:>6} filas")

    print("\n" + "─" * 80)
    print("  CUENTAS ADMINISTRADORAS DESTACADAS:")
    print("─" * 80)
    for adm in ADMIN_USERS:
        print(f"  • Email: {adm['email']:<26} Pass: {adm['password']:<18} Rol: ADMIN ({adm['firstName']})")

    print("\n" + "─" * 80)
    print("  MUESTRA DE USUARIOS ESTÁNDAR REGISTRADOS:")
    print("─" * 80)
    for u in users[:10]:
        print(f"  • {u['email']:<28} Pass: {u['password']:<18} @{u['nickname']:<16} ({u.get('city', 'Madrid')})")
    print(f"  ... y {len(users) - 10} usuarios adicionales disponibles.")

    print("\n" + "─" * 80)
    print("  PRINCIPALES CLUSTERS DE ALOJAMIENTOS POR CIUDAD:")
    print("─" * 80)
    seen_cities = set()
    for acc in ACCOMMODATIONS_LOCATIONS:
        if acc["city"] not in seen_cities:
            print(f"  • {acc['city']:<12} -> {acc['address']} ({acc['name_hint']})")
            seen_cities.add(acc["city"])

    print("\n" + "─" * 80)
    print("  MENSAJERÍA CONTEXTUAL Y CONSULTAS:")
    print("─" * 80)
    print(f"  • Hilos de conversación creados: {conversations_count}")
    print(f"  • Mensajes intercambiados: {messages_count} (incluye Nudges automáticos del sistema)")

    print("\n" + "─" * 80)
    print("  HOGARES Y CONVIVENCIA CREADOS:")
    print("─" * 80)
    for h in homes:
        print(f"  • \"{h['name']}\" — Código: {h['invitation_code']} ({len(h['members'])} convivientes)")
    print(f"  • Gamificación: {chores_count} Tareas registradas en \"Ruzafa Vibes & Sunshine\" (puntos, rescates y series)")

    print("\n" + "=" * 80)
    print("  ✨ BASE DE DATOS POBLADA EXITOSAMENTE CON VOLUMEN REALISTA PARA QA")
    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Colivi QA High-Density Database Seeder")
    parser.add_argument("--skip-wipe", action="store_true", help="Omitir el vaciado (TRUNCATE) de la base de datos")
    parser.add_argument("--url", type=str, default=BASE_URL, help="URL base de la API de Colivi")
    args = parser.parse_args()

    start_time = time.time()
    client = ApiClient(base_url=args.url)

    print("=" * 80)
    print("   COLIVI — AUTOMATIZACIÓN DE SEEDING QA Y POBLACIÓN DE ALTA DENSIDAD")
    print("=" * 80)

    # 1. Comprobar salud del backend
    print(f"\n[PASO 0/6] Comprobando conexión con la API en {client.base_url}...")
    if not client.check_health():
        print(f"[!] ERROR: No se puede conectar con el backend en {client.base_url}.")
        print("    Asegúrate de que la aplicación Spring Boot está iniciada y accesible.")
        sys.exit(1)
    print("  [+] Backend en línea y respondiendo correctamente.")

    # 2. Cargar imágenes de prueba
    images = load_images()
    print(f"  [+] {len(images)} imágenes cargadas desde '{IMGS_DIR}'.")

    # 3. Vaciar base de datos si no se omite
    if not args.skip_wipe:
        print("\n[PASO 1/6] Vaciando la base de datos...")
        if wipe_database():
            print("  [+] Base de datos truncada exitosamente vía PostgreSQL.")
        else:
            print("  [i] Continuando con el seeding (los registros existentes serán actualizados)...")
    else:
        print("\n[PASO 1/6] Omitiendo vaciado de base de datos (--skip-wipe activo).")
        # Idempotencia: si ya existen anuncios publicados en la base de datos, no duplicar el sembrado
        try:
            listings_res = client.get("/api/v1/listings", params={"size": 1})
            total_listings = listings_res.get("totalElements", 0) if isinstance(listings_res, dict) else len(listings_res)
            if total_listings and total_listings > 10:
                print(f"  [i] La base de datos ya contiene {total_listings} anuncios de alojamiento.")
                print("      Se omite el sembrado adicional para evitar duplicidades.")
                print("=" * 80)
                print("  BASE DE DATOS YA POBLADA PREVIAMENTE — SEEDER FINALIZADO")
                print("=" * 80 + "\n")
                sys.exit(0)
        except Exception as e:
            pass

    # 4. Registrar usuarios y administradores
    admins, users_list, users_by_email = seed_users(client, images)

    # 5. Crear alojamientos, subir fotos y publicar anuncios
    accommodations, listings = seed_accommodations_and_listings(client, users_list, images)

    # 6. Crear reservas y reseñas verificadas
    bookings, reviews_count = seed_bookings_and_reviews(client, users_list, listings, users_by_email)

    # 7. Crear conversaciones contextuales y mensajes de alta densidad
    conversations_count, messages_count = seed_messages_and_conversations(
        client, users_list, listings, bookings, users_by_email
    )

    # 8. Crear hogares, gastos compartidos y pagos
    homes, expenses_count, payments_count = seed_homes_expenses_and_payments(client, users_by_email)

    # 9. Crear tareas domésticas gamificadas
    chores_count = seed_chores(client, homes, users_by_email)

    # 10. Generar denuncias y moderación
    reports_count = seed_reports_and_moderation(client, admins, users_list, listings)

    # 11. Simular búsquedas para analítica e historial
    searches_count = seed_search_histories(client, users_list)

    # 12. Mostrar resumen final con estadísticas de base de datos
    elapsed = time.time() - start_time
    print_summary(
        admins=admins,
        users=users_list,
        accommodations=accommodations,
        listings=listings,
        bookings=bookings,
        reviews_count=reviews_count,
        conversations_count=conversations_count,
        messages_count=messages_count,
        homes=homes,
        expenses_count=expenses_count,
        payments_count=payments_count,
        chores_count=chores_count,
        reports_count=reports_count,
        searches_count=searches_count,
        elapsed_time=elapsed,
    )


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[!] Proceso cancelado por el usuario.")
        sys.exit(0)
    except Exception as exc:
        print(f"\n[FATAL] Error en la ejecución del script: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
