#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
booking_seeder.py — Booking Requests, Lifecycle Transitions & Reviews Seeder
"""

import calendar
import datetime
import random
import time
from typing import Any, Dict, List, Tuple

from ..api_client import ApiClient
from ..data_fixtures import REVIEW_TEMPLATES


def _calculate_booking_dates(offset_start_months: int = 0, duration_months: int = 4) -> Tuple[datetime.date, datetime.date]:
    """
    Calcula fechas válidas para Colivi:
    - startDate: Primer día del mes (1)
    - endDate: Último día del mes (28/29/30/31)
    """
    today = datetime.date.today()
    
    # Calcular mes y año de inicio
    start_m = today.month + offset_start_months
    start_y = today.year + (start_m - 1) // 12
    start_m = ((start_m - 1) % 12) + 1
    start_date = datetime.date(start_y, start_m, 1)

    # Calcular mes y año de fin
    end_m = start_m + duration_months
    end_y = start_y + (end_m - 1) // 12
    end_m = ((end_m - 1) % 12) + 1
    last_day = calendar.monthrange(end_y, end_m)[1]
    end_date = datetime.date(end_y, end_m, last_day)

    return start_date, end_date


def seed_bookings_and_reviews(
    client: ApiClient,
    users: List[Dict[str, Any]],
    listings: List[Dict[str, Any]],
    users_by_email: Dict[str, Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Crea solicitudes de reserva en distintos estados y publica reseñas reales
    sobre estancias confirmadas.
    """
    print("\n[FASE 3/5] Creando solicitudes de reserva, confirmaciones y reseñas...")

    created_bookings: List[Dict[str, Any]] = []
    created_reviews_count = 0
    review_pointer = 0

    # Solo permitimos pago y cierre de reserva en los primeros 3 anuncios
    # para generar reseñas de muestra sin bloquear el catálogo general.
    PAID_SAMPLE_COUNT = 3

    for idx, listing in enumerate(listings):
        host_email = listing["host_email"]
        listing_id = listing["id"]

        # Filtrar inquilinos potenciales que no sean el anfitrión del anuncio
        potential_tenants = [u for u in users if u["email"] != host_email and u.get("token")]
        if not potential_tenants:
            continue

        # Para los primeros anuncios generamos 2-3 solicitudes; para el resto, 1-2 solicitudes variadas
        num_requests = random.randint(2, 3) if idx < PAID_SAMPLE_COUNT else random.randint(1, 2)
        tenants_for_listing = random.sample(potential_tenants, min(num_requests, len(potential_tenants)))

        for req_idx, tenant in enumerate(tenants_for_listing):
            # Asignar trimestres consecutivos y no solapados para evitar colisiones de fechas
            start_offset = req_idx * 4
            duration = 2
            start_date, end_date = _calculate_booking_dates(offset_start_months=start_offset, duration_months=duration)

            booking_payload = {
                "accommodationListingId": listing_id,
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "message": (
                    f"¡Hola! Soy {tenant['firstName']}, tengo mucho interés en alquilar esta habitación/piso. "
                    f"Trabajo/estudio en la zona y busco una estancia tranquila de convivencia agradable."
                ),
            }

            try:
                # 1. Crear solicitud por parte del inquilino
                b_res = client.post("/api/v1/booking-requests", booking_payload, token=tenant["token"], expected=201)
                booking_id = b_res.get("id")

                if not booking_id:
                    continue

                host_user = users_by_email.get(host_email)
                host_token = host_user["token"] if host_user else None

                # 2. Transiciones de estado:
                # Si es uno de los primeros 3 anuncios y es la primera solicitud, completamos pago y reseña
                if idx < PAID_SAMPLE_COUNT and req_idx == 0:
                    # CONFIRMED FLOW: Host acepta -> Inquilino confirma y paga
                    if host_token:
                        client.patch(
                            f"/api/v1/booking-requests/{booking_id}/status",
                            params={"status": "ACCEPTED"},
                            token=host_token,
                            expected=200,
                        )

                        pay_payload = {
                            "paymentToken": f"tok_visa_seed_{booking_id[:8]}",
                            "paymentMethod": "CARD",
                        }
                        client.post(
                            f"/api/v1/booking-requests/{booking_id}/confirm-payment",
                            pay_payload,
                            token=tenant["token"],
                            expected=200,
                        )

                        # 3. Inquilino publica una reseña para la estancia confirmada
                        rev_template = REVIEW_TEMPLATES[review_pointer % len(REVIEW_TEMPLATES)]
                        review_pointer += 1

                        rev_payload = {
                            "rating": rev_template["rating"],
                            "comment": rev_template["comment"],
                        }

                        try:
                            client.post(
                                f"/api/v1/listings/{listing_id}/reviews",
                                rev_payload,
                                token=tenant["token"],
                                expected=201,
                            )
                            created_reviews_count += 1
                            print(f"  [+] Reseña [{rev_template['rating']}★] publicada por @{tenant['nickname']} en: {listing['title'][:38]}...")
                        except Exception:
                            pass
                else:
                    # Para todos los demás anuncios, distribuimos estados sin realizar el pago
                    # de modo que el anuncio permanece AVAILABLE en el mapa y catálogo.
                    mode_choice = (idx + req_idx) % 4
                    if mode_choice == 0:
                        # PENDING: Se queda pendiente de respuesta por parte del anfitrión
                        pass
                    elif mode_choice == 1 and host_token:
                        # ACCEPTED: El anfitrión la aceptó, pero el inquilino no ha pagado (sigue AVAILABLE)
                        client.patch(
                            f"/api/v1/booking-requests/{booking_id}/status",
                            params={"status": "ACCEPTED"},
                            token=host_token,
                            expected=200,
                        )
                    elif mode_choice == 2 and host_token:
                        # REJECTED: Rechazada por el anfitrión (sigue AVAILABLE)
                        client.patch(
                            f"/api/v1/booking-requests/{booking_id}/status",
                            params={"status": "REJECTED"},
                            token=host_token,
                            expected=200,
                        )
                    elif mode_choice == 3:
                        # CANCELLED: Cancelada por el inquilino (sigue AVAILABLE)
                        client.patch(
                            f"/api/v1/booking-requests/{booking_id}/status",
                            params={"status": "CANCELLED"},
                            token=tenant["token"],
                            expected=200,
                        )

                created_bookings.append({
                    "id": booking_id,
                    "listing_id": listing_id,
                    "requester_id": tenant["id"],
                    "requester_email": tenant["email"],
                })

            except Exception:
                pass

        time.sleep(0.04)

    print(f"\n  [✔] {len(created_bookings)} Solicitudes de reserva procesadas y {created_reviews_count} Reseñas publicadas.\n")
    return created_bookings, created_reviews_count
