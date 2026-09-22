#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
message_seeder.py — High-Density Contextual Messaging & Conversation Seeder
=============================================================================
Población realista y masiva de conversaciones, consultas y mensajes en Colivi:

1. Conversaciones de Consulta pura (sin reserva, dudas sobre internet, normas, gastos).
2. Conversaciones con activación automática de NUDGE tras 4+ mensajes intercambiados.
3. Conversaciones vinculadas al ciclo de vida de BookingRequests (CONFIRMED, ACCEPTED, PENDING).
4. Conversaciones archivadas por anfitriones (consultas ya resueltas).
5. Mensajes no leídos para visualización inmediata de contadores en el Inbox.
6. Ajuste temporal gradual para una cronología realista (minutos, horas y días atrás).
"""

import random
from typing import Any, Dict, List, Tuple

from ..api_client import ApiClient, execute_sql
from ..message_fixtures import CONVERSATION_FLOWS, EXTRA_HOST_ANSWERS, EXTRA_TENANT_QUESTIONS


def seed_messages_and_conversations(
    client: ApiClient,
    users: List[Dict[str, Any]],
    listings: List[Dict[str, Any]],
    bookings: List[Dict[str, Any]],
    users_by_email: Dict[str, Dict[str, Any]],
) -> Tuple[int, int]:
    """
    Pobla la base de datos con un alto volumen de conversaciones realistas y mensajes
    intercambiados entre inquilinos y propietarios.
    
    Retorna: (total_conversaciones_creadas, total_mensajes_creados)
    """
    print("\n[FASE 4/5] Generando conversaciones contextuales y mensajes de alta densidad...")

    created_conversations_count = 0
    created_messages_count = 0

    # Indexar usuarios por ID para búsquedas rápidas
    users_by_id: Dict[str, Dict[str, Any]] = {
        str(u["id"]): u for u in users if u.get("id")
    }

    # Mapeo de bookings por listing y requester para vinculación
    bookings_map: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for b in bookings:
        listing_id = str(b.get("listing_id") or b.get("accommodationListingId") or "")
        req_id = str(b.get("requester_id") or b.get("requesterId") or "")
        req_email = b.get("requester_email") or ""
        if listing_id and (req_id or req_email):
            key = (listing_id, req_id if req_id else req_email)
            bookings_map[key] = b

    # Conjunto para evitar violar el índice UNIQUE(tenant_id, host_id, listing_id)
    seen_conversations = set()

    # ─────────────────────────────────────────────────────────────────────────────
    # BLOQUE 1: Conversaciones sobre Solicitudes de Reserva Existentes (20-30 hilos)
    # ─────────────────────────────────────────────────────────────────────────────
    print("  • Generando hilos vinculados a solicitudes de reserva activas...")
    for idx, (pair, booking_info) in enumerate(bookings_map.items()):
        if idx >= 30:
            break

        listing_id, user_key = pair
        booking_id = booking_info.get("id")

        tenant = users_by_id.get(user_key) or users_by_email.get(user_key)
        target_listing = next((l for l in listings if str(l.get("id")) == str(listing_id)), None)
        if not target_listing or not tenant or not tenant.get("token"):
            continue

        host_id = str(target_listing.get("host_id") or target_listing.get("hostId") or "")
        host_email = target_listing.get("host_email") or ""
        host = users_by_id.get(host_id) or users_by_email.get(host_email)
        if not host or not host.get("token") or host.get("id") == tenant.get("id"):
            continue

        pair_key = (tenant["id"], host["id"], listing_id)
        if pair_key in seen_conversations:
            continue
        seen_conversations.add(pair_key)

        try:
            # 1. Crear o recuperar la consulta como tenant
            conv_res = client.post(
                "/api/v1/conversations/consultations",
                params={"listingId": listing_id},
                token=tenant["token"],
                expected=[200, 201],
            )
            conv_id = conv_res.get("conversationId")
            if not conv_id:
                continue

            created_conversations_count += 1

            # 2. Vincular reserva activa en base de datos
            execute_sql(f"UPDATE conversations SET active_booking_request_id = '{booking_id}' WHERE id = '{conv_id}';")

            # 3. Intercambiar mensajes específicos según flujo de coordinación
            flow = CONVERSATION_FLOWS[7]  # booking_accepted_and_keys
            for msg_item in flow["messages"]:
                is_tenant_msg = msg_item["sender"] == "tenant"
                sender_token = tenant["token"] if is_tenant_msg else host["token"]
                
                client.post(
                    f"/api/v1/conversations/{conv_id}/messages",
                    payload={"content": msg_item["text"]},
                    token=sender_token,
                    expected=201,
                )
                created_messages_count += 1

            # 4. Marcar como leído por el anfitrión para simular chat atendido
            client.patch(f"/api/v1/conversations/{conv_id}/read-receipt", token=host["token"], expected=204)

        except Exception:
            pass

    # ─────────────────────────────────────────────────────────────────────────────
    # BLOQUE 2: Consultas Abiertas Dinámicas con Nudges y Variedad Temática (20+ hilos)
    # ─────────────────────────────────────────────────────────────────────────────
    print("  • Generando consultas abiertas, preguntas y activación de Nudges...")
    available_listings = list(listings)
    random.shuffle(available_listings)

    flow_idx = 0
    for l_idx, listing in enumerate(available_listings):
        if created_conversations_count >= 45:
            break

        host_id = str(listing.get("host_id") or listing.get("hostId") or "")
        host_email = listing.get("host_email") or ""
        host = users_by_id.get(host_id) or users_by_email.get(host_email)
        if not host or not host.get("token"):
            continue

        # Seleccionar 1-2 inquilinos potenciales distintos al host
        potential_tenants = [u for u in users if u.get("id") != host.get("id") and u.get("token")]
        if not potential_tenants:
            continue

        chosen_tenants = random.sample(potential_tenants, min(2, len(potential_tenants)))

        for tenant in chosen_tenants:
            pair_key = (tenant["id"], host["id"], listing["id"])
            if pair_key in seen_conversations:
                continue
            seen_conversations.add(pair_key)

            try:
                # Iniciar consulta
                conv_res = client.post(
                    "/api/v1/conversations/consultations",
                    params={"listingId": listing["id"]},
                    token=tenant["token"],
                    expected=[200, 201],
                )
                conv_id = conv_res.get("conversationId")
                if not conv_id:
                    continue

                created_conversations_count += 1

                # Seleccionar un flujo temático rotativo
                selected_flow = CONVERSATION_FLOWS[flow_idx % len(CONVERSATION_FLOWS)]
                flow_idx += 1

                # Enviar mensajes del flujo
                msgs_to_send = selected_flow["messages"]
                for m in msgs_to_send:
                    sender_token = tenant["token"] if m["sender"] == "tenant" else host["token"]
                    client.post(
                        f"/api/v1/conversations/{conv_id}/messages",
                        payload={"content": m["text"]},
                        token=sender_token,
                        expected=201,
                    )
                    created_messages_count += 1

                # Casos especiales de estado:
                # A. Consulta archivada (1 de cada 5 hilos)
                if selected_flow["category"] == "CONSULTA_ARCHIVADA" or (flow_idx % 5 == 0):
                    client.patch(
                        f"/api/v1/conversations/{conv_id}/archive",
                        params={"archived": True},
                        token=host["token"],
                        expected=204,
                    )

                # B. Consulta con mensaje no leído para el anfitrión (1 de cada 4 hilos)
                elif flow_idx % 4 == 0:
                    extra_q = random.choice(EXTRA_TENANT_QUESTIONS)
                    client.post(
                        f"/api/v1/conversations/{conv_id}/messages",
                        payload={"content": extra_q},
                        token=tenant["token"],
                        expected=201,
                    )
                    created_messages_count += 1
                    # No marcamos como leído: queda hostUnreadCount = 1

                # C. Consulta leída por ambos
                else:
                    client.patch(f"/api/v1/conversations/{conv_id}/read-receipt", token=host["token"], expected=204)
                    client.patch(f"/api/v1/conversations/{conv_id}/read-receipt", token=tenant["token"], expected=204)

            except Exception:
                pass

    # ─────────────────────────────────────────────────────────────────────────────
    # BLOQUE 3: Ajuste Cronológico Realista en Base de Datos
    # ─────────────────────────────────────────────────────────────────────────────
    print("  • Ajustando sellos temporales graduales (historial extendido de días y horas)...")
    try:
        # Distribuir la antigüedad de las conversaciones entre hace 1 hora y hace 20 días
        time_adjust_sql = """
        DO $$
        DECLARE
            r_conv RECORD;
            r_msg RECORD;
            conv_offset_hours INT := 1;
            msg_offset_minutes INT;
            base_time TIMESTAMP;
        BEGIN
            FOR r_conv IN SELECT id FROM conversations ORDER BY id LOOP
                -- Antigüedad escalonada por conversación
                base_time := CURRENT_TIMESTAMP - (conv_offset_hours || ' hours')::INTERVAL;
                conv_offset_hours := (conv_offset_hours + 7) % 480; -- Hasta 20 días atrás
                
                msg_offset_minutes := 0;
                FOR r_msg IN SELECT id FROM messages WHERE conversation_id = r_conv.id ORDER BY created_at ASC LOOP
                    UPDATE messages 
                    SET created_at = base_time + (msg_offset_minutes || ' minutes')::INTERVAL
                    WHERE id = r_msg.id;
                    msg_offset_minutes := msg_offset_minutes + 12;
                END LOOP;

                -- Ajustar last_message_at de la conversación al último mensaje emitido
                UPDATE conversations 
                SET last_message_at = (
                    SELECT COALESCE(MAX(created_at), base_time) 
                    FROM messages 
                    WHERE conversation_id = r_conv.id
                )
                WHERE id = r_conv.id;
            END LOOP;
        END $$;
        """
        execute_sql(time_adjust_sql)
    except Exception:
        pass

    print(f"\n  [✔] {created_conversations_count} Conversaciones pobladas y {created_messages_count} Mensajes intercambiados exitosamente.\n")
    return created_conversations_count, created_messages_count
