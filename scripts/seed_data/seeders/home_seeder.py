#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
home_seeder.py — Homes, Roommates, Shared Expenses & Debt Payments Seeder
"""

import time
from typing import Any, Dict, List, Tuple

from ..api_client import ApiClient
from ..data_fixtures import HOMES_DATA


def seed_homes_expenses_and_payments(
    client: ApiClient,
    users_by_email: Dict[str, Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], int, int]:
    """
    Crea comunidades de convivencia (hogares), gestiona la unión de convivientes
    por código de invitación, genera gastos compartidos y registra pagos directos.
    """
    print("\n[FASE 4/5] Creando hogares, uniendo miembros, registrando gastos y pagos...")

    created_homes: List[Dict[str, Any]] = []
    total_expenses_count = 0
    total_payments_count = 0

    for idx, home_data in enumerate(HOMES_DATA, 1):
        creator_email = home_data["creator_email"]
        creator = users_by_email.get(creator_email)
        if not creator:
            continue

        creator_token = creator["token"]
        creator_id = creator["id"]

        # 1. Crear el hogar
        create_payload = {"name": home_data["name"]}
        home_res = client.post("/api/v1/homes", create_payload, token=creator_token, expected=201)
        home_id = home_res["id"]
        invitation_code = home_res["invitationCode"]

        print(f"  [+] [{idx:02d}/{len(HOMES_DATA)}] Hogar: {home_data['name']} ({home_data['city']})")
        print(f"      Admin: {creator_email} | Código Invitación: {invitation_code}")

        # Mapa de miembros en el hogar {email: user_id}
        members_map: Dict[str, str] = {creator_email: creator_id}

        # 2. Unir a los compañeros mediante el código de invitación
        for member_email in home_data["member_emails"]:
            member = users_by_email.get(member_email)
            if not member:
                continue

            try:
                join_payload = {"invitationCode": invitation_code}
                join_res = client.post("/api/v1/homes/join", join_payload, token=member["token"], expected=200)
                members_map[member_email] = member["id"]
                print(f"      • Conviviente unido: {member_email} (@{member['nickname']})")
            except Exception as e:
                print(f"      [!] Error uniendo a {member_email}: {e}")

        all_member_ids = list(members_map.values())

        # 3. Crear gastos compartidos para este hogar
        for exp in home_data.get("expenses", []):
            payer_email = exp["payer"]
            payer = users_by_email.get(payer_email)
            payer_id = members_map.get(payer_email)

            if not payer or not payer_id:
                continue

            # El gasto lo puede registrar cualquier miembro (usamos el token del pagador)
            expense_payload = {
                "description": exp["desc"],
                "totalAmount": exp["amount"],
                "payerId": payer_id,
                "participantIds": all_member_ids,
            }

            try:
                client.post(
                    f"/api/v1/homes/{home_id}/expenses",
                    expense_payload,
                    token=payer["token"],
                    expected=201,
                )
                total_expenses_count += 1
                print(f"      [+] Gasto: \"{exp['desc'][:38]}\" ({exp['amount']}€) pagado por @{payer['nickname']}")
            except Exception as e:
                print(f"      [!] Error creando gasto: {e}")

        # 4. Registrar pagos directos entre convivientes (liquidación de deudas)
        for payment in home_data.get("payments", []):
            from_email = payment["from"]
            to_email = payment["to"]

            payer_user = users_by_email.get(from_email)
            receiver_user = users_by_email.get(to_email)

            payer_id = members_map.get(from_email)
            receiver_id = members_map.get(to_email)

            if not payer_user or not receiver_user or not payer_id or not receiver_id:
                continue

            payment_payload = {
                "payerId": payer_id,
                "receiverId": receiver_id,
                "amount": payment["amount"],
                "notes": payment["notes"],
            }

            try:
                client.post(
                    f"/api/v1/homes/{home_id}/expenses/payments",
                    payment_payload,
                    token=payer_user["token"],
                    expected=201,
                )
                total_payments_count += 1
                print(f"      [💳] Pago: {payment['amount']}€ de @{payer_user['nickname']} a @{receiver_user['nickname']} (\"{payment['notes'][:25]}\")")
            except Exception as e:
                print(f"      [!] Error registrando pago: {e}")

        created_homes.append({
            "id": home_id,
            "name": home_data["name"],
            "invitation_code": invitation_code,
            "creator": creator_email,
            "members": list(members_map.keys()),
        })
        time.sleep(0.08)

    print(f"\n  [✔] {len(created_homes)} Hogares creados con {total_expenses_count} Gastos y {total_payments_count} Pagos registrados.\n")
    return created_homes, total_expenses_count, total_payments_count
