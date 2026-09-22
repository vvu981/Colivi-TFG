#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
report_seeder.py — Moderation Reports & Admin Resolution Seeder
"""

import random
import time
from typing import Any, Dict, List

from ..api_client import ApiClient
from ..data_fixtures import REPORT_TEMPLATES


def seed_reports_and_moderation(
    client: ApiClient,
    admin_users: Dict[str, Dict[str, Any]],
    users: List[Dict[str, Any]],
    listings: List[Dict[str, Any]]
) -> int:
    """
    Genera denuncias sobre anuncios y usuarios, y simula la moderación
    y resolución administrativa por parte del equipo de soporte.
    """
    print("\n[FASE 5/5] Generando denuncias de moderación y resoluciones de administración...")

    created_reports_count = 0
    admin_token = None

    # Obtenemos el token de cualquiera de los administradores
    for adm in admin_users.values():
        if adm.get("token"):
            admin_token = adm["token"]
            break

    for idx, template in enumerate(REPORT_TEMPLATES, 1):
        target_type = template["type"]
        target_id = None

        if target_type == "LISTING" and listings:
            target_listing = listings[idx % len(listings)]
            target_id = target_listing["id"]
            # El reportero no debe ser el dueño del anuncio
            reporters = [u for u in users if u["id"] != target_listing["host_id"]]
        elif target_type == "USER" and len(users) >= 2:
            target_user = users[idx % len(users)]
            target_id = target_user["id"]
            reporters = [u for u in users if u["id"] != target_id]
        else:
            continue

        if not reporters or not target_id:
            continue

        reporter = random.choice(reporters)

        report_payload = {
            "targetType": target_type,
            "targetId": target_id,
            "reason": template["reason"],
            "description": template["description"],
        }

        try:
            # 1. El usuario envía la denuncia
            rep_res = client.post("/api/v1/reports", report_payload, token=reporter["token"], expected=201)
            report_id = rep_res["id"]
            created_reports_count += 1
            print(f"  [+] Denuncia [{template['reason']}] sobre {target_type} ({target_id[:8]}...) por @{reporter['nickname']}")

            # 2. Si la plantilla especifica una acción administrativa y tenemos token de admin
            admin_action = template.get("admin_action")
            if admin_action and admin_action != "PENDING" and admin_token:
                status_payload = {
                    "status": admin_action,
                    "adminNotes": template.get("admin_notes") or f"Revisión de moderación completada con estado {admin_action}.",
                }
                client.patch(
                    f"/api/v1/admin/reports/{report_id}/status",
                    status_payload,
                    token=admin_token,
                    expected=200,
                )
                print(f"      • Moderador resolvió -> Estado: {admin_action} | Notas: \"{status_payload['adminNotes'][:40]}...\"")

                # En algunos casos marcamos el feedback como reconocido, y en otros lo dejamos pendiente
                if admin_action == "RESOLVED" and (idx % 2 == 0):
                    try:
                        client.patch(
                            f"/api/v1/reports/{report_id}/acknowledge-feedback",
                            token=reporter["token"],
                            expected=204,
                        )
                    except Exception:
                        pass

        except Exception as e:
            # Continuar si hay restricción de unicidad
            pass

        time.sleep(0.04)

    print(f"\n  [✔] {created_reports_count} Denuncias de moderación registradas y gestionadas.\n")
    return created_reports_count
