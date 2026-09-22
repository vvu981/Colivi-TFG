#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
chore_seeder.py — Gamified Chores & Leaderboard Seeder for Colivi
=============================================================================
Puebla tareas domésticas con ciclo de vida completo:
- Tareas completadas a tiempo con asignación de puntos normales.
- Tareas atrasadas y rescatadas por compañeros (mecánica de robo/rescate de puntos).
- Tareas actualmente vencidas pendientes de rescate.
- Tareas pendientes para hoy y fechas futuras.
- Series recurrentes semanales compartiendo seriesId.
"""

import datetime
import time
from typing import Any, Dict, List, Optional

from ..api_client import ApiClient


def seed_chores(
    client: ApiClient,
    homes: List[Dict[str, Any]],
    users_by_email: Dict[str, Dict[str, Any]]
) -> int:
    """
    Puebla el módulo de tareas domésticas gamificadas para el hogar 'Ruzafa Vibes & Sunshine'.
    """
    print("\n[FASE 5/5] Creando tareas domésticas gamificadas y simulando dinámicas de puntos y rescates...")

    # 1. Localizar el hogar 'Ruzafa Vibes & Sunshine'
    target_home_name = "Ruzafa Vibes & Sunshine"
    target_home = next((h for h in homes if h.get("name") == target_home_name), None)

    if not target_home:
        print(f"  [!] Advertencia: No se encontró el hogar objetivo '{target_home_name}'. Omitiendo seeding de tareas.")
        return 0

    home_id = target_home["id"]
    print(f"  [+] Hogar seleccionado: \"{target_home_name}\" (ID: {home_id})")

    # 2. Localizar miembros del hogar
    miguel = users_by_email.get("miguel.fernandez@gmail.com")
    carmen = users_by_email.get("carmen.delgado@gmail.com")
    javier = users_by_email.get("javier.ramos@gmail.com")
    ainoa = users_by_email.get("ainoa.garrido@gmail.com")

    if not all([miguel, carmen, javier, ainoa]):
        print("  [!] Advertencia: Faltan miembros requeridos para el hogar de Ruzafa. Omitiendo tareas.")
        return 0

    today = datetime.date.today()
    created_chores_count = 0

    # Helper para crear una tarea
    def create_chore_item(
        creator_user: Dict[str, Any],
        assignee_user: Dict[str, Any],
        title: str,
        description: Optional[str],
        base_points: int,
        due_date: datetime.date,
        recurrence: str = "NONE",
        occurrences: int = 1
    ) -> List[Dict[str, Any]]:
        payload = {
            "title": title,
            "description": description,
            "assigneeId": assignee_user["id"],
            "basePoints": base_points,
            "dueDate": due_date.isoformat(),
            "recurrence": recurrence,
            "occurrences": occurrences,
        }
        res = client.post(
            f"/api/v1/homes/{home_id}/chores",
            payload=payload,
            token=creator_user["token"],
            expected=201
        )
        if isinstance(res, list):
            return res
        return [res] if res else []

    # Helper para completar/rescatar una tarea
    def complete_chore_item(user: Dict[str, Any], chore_id: str) -> Optional[Dict[str, Any]]:
        try:
            res = client.patch(
                f"/api/v1/homes/{home_id}/chores/{chore_id}/complete",
                token=user["token"],
                expected=200
            )
            return res
        except Exception as e:
            print(f"      [!] Error completando tarea {chore_id} por {user.get('nickname')}: {e}")
            return None

    # ── 1. TAREAS COMPLETADAS A TIEMPO (Puntos normales ganados) ──────────────
    # A) Miguel: Limpiar encimeras y mesa de cocina (hace 4 días)
    t1_list = create_chore_item(
        creator_user=miguel,
        assignee_user=miguel,
        title="Limpiar encimeras y mesa tras la cena",
        description="Fregar superficies con desengrasante tras cocinar paella",
        base_points=15,
        due_date=today - datetime.timedelta(days=4)
    )
    if t1_list:
        created_chores_count += len(t1_list)
        complete_chore_item(miguel, t1_list[0]["id"])
        print(f"      [✔] Tarea a tiempo: \"{t1_list[0]['title']}\" (+15 pts para @{miguel['nickname']})")

    # B) Ainoa: Barrer y fregar terraza de Ruzafa (hace 3 días)
    t2_list = create_chore_item(
        creator_user=miguel,
        assignee_user=ainoa,
        title="Barrer y fregar terraza de Ruzafa",
        description="Quitar hojas secas y fregar el suelo exterior",
        base_points=15,
        due_date=today - datetime.timedelta(days=3)
    )
    if t2_list:
        created_chores_count += len(t2_list)
        complete_chore_item(ainoa, t2_list[0]["id"])
        print(f"      [✔] Tarea a tiempo: \"{t2_list[0]['title']}\" (+15 pts para @{ainoa['nickname']})")

    # C) Javier: Bajar basura y reciclaje de la semana pasada (hace 2 días)
    t3_list = create_chore_item(
        creator_user=carmen,
        assignee_user=javier,
        title="Bajar vidrio y cartón acumulado",
        description="Llevar al contenedor verde y azul de la esquina",
        base_points=10,
        due_date=today - datetime.timedelta(days=2)
    )
    if t3_list:
        created_chores_count += len(t3_list)
        complete_chore_item(javier, t3_list[0]["id"])
        print(f"      [✔] Tarea a tiempo: \"{t3_list[0]['title']}\" (+10 pts para @{javier['nickname']})")

    # ── 2. TAREAS RESCATADAS (Gamificación: Salvador gana puntos, Asignado pierde) ──
    # D) Javier tenía que descongelar nevera hace 5 días. Carmen la completó (¡Rescatada!)
    t4_list = create_chore_item(
        creator_user=miguel,
        assignee_user=javier,
        title="Descongelar y desinfectar la nevera",
        description="Retirar restos caducados y limpiar los cajones de verduras",
        base_points=20,
        due_date=today - datetime.timedelta(days=5)
    )
    if t4_list:
        created_chores_count += len(t4_list)
        complete_chore_item(carmen, t4_list[0]["id"])
        print(f"      [🛡️] Tarea RESCATADA: \"{t4_list[0]['title']}\" (+20 pts para @{carmen['nickname']} salvadora, -20 pts para @{javier['nickname']})")

    # E) Carmen tenía que limpiar la campana extractora hace 3 días. Miguel la completó (¡Rescatada!)
    t5_list = create_chore_item(
        creator_user=ainoa,
        assignee_user=carmen,
        title="Limpieza profunda de la vitrocerámica y campana",
        description="Lavar filtros metálicos en el lavavajillas",
        base_points=15,
        due_date=today - datetime.timedelta(days=3)
    )
    if t5_list:
        created_chores_count += len(t5_list)
        complete_chore_item(miguel, t5_list[0]["id"])
        print(f"      [🛡️] Tarea RESCATADA: \"{t5_list[0]['title']}\" (+15 pts para @{miguel['nickname']} salvador, -15 pts para @{carmen['nickname']})")

    # ── 3. TAREAS ATRASADAS PENDIENTES DE RESCATE (Visibles en ¡Para Rescatar!) ────
    # F) Ainoa tiene pendiente el baño común (venció hace 2 días)
    t6_list = create_chore_item(
        creator_user=miguel,
        assignee_user=ainoa,
        title="Limpieza profunda del baño común",
        description="Espejo, lavabo, inodoro y reposición de toallas limpias",
        base_points=15,
        due_date=today - datetime.timedelta(days=2)
    )
    if t6_list:
        created_chores_count += len(t6_list)
        print(f"      [🚨] Tarea ATRASADA (Rescatable): \"{t6_list[0]['title']}\" (15 pts en juego, asignada a @{ainoa['nickname']})")

    # G) Javier tiene pendiente el pasillo (venció ayer)
    t7_list = create_chore_item(
        creator_user=carmen,
        assignee_user=javier,
        title="Pasar la aspiradora y fregar el pasillo",
        description="Especial atención a la zona de zapatos de la entrada",
        base_points=10,
        due_date=today - datetime.timedelta(days=1)
    )
    if t7_list:
        created_chores_count += len(t7_list)
        print(f"      [🚨] Tarea ATRASADA (Rescatable): \"{t7_list[0]['title']}\" (10 pts en juego, asignada a @{javier['nickname']})")

    # ── 4. TAREAS PENDIENTES PARA HOY ─────────────────────────────────────────
    # H) Carmen: Comprar suministros básicos del hogar
    t8_list = create_chore_item(
        creator_user=miguel,
        assignee_user=carmen,
        title="Comprar suministros (estropajos, bolsas y lavavajillas)",
        description="Aprovechar la visita al Mercadona de Ruzafa",
        base_points=10,
        due_date=today
    )
    if t8_list:
        created_chores_count += len(t8_list)
        print(f"      [⏳] Tarea para HOY: \"{t8_list[0]['title']}\" (10 pts, asignada a @{carmen['nickname']})")

    # ── 5. TAREAS PENDIENTES A FUTURO ─────────────────────────────────────────
    # I) Miguel: Cuidar plantas de la terraza (en 2 días)
    t9_list = create_chore_item(
        creator_user=ainoa,
        assignee_user=miguel,
        title="Regar y abonar plantas de la terraza",
        description="Revisar que no se acumule agua en los platos",
        base_points=10,
        due_date=today + datetime.timedelta(days=2)
    )
    if t9_list:
        created_chores_count += len(t9_list)
        print(f"      [📅] Tarea futura: \"{t9_list[0]['title']}\" (en 2 días, asignada a @{miguel['nickname']})")

    # J) Ainoa: Poner y tender lavadora de blancos (en 4 días)
    t10_list = create_chore_item(
        creator_user=carmen,
        assignee_user=ainoa,
        title="Lavadora de toallas y alfombrillas de baño",
        description="Programa largo a 60 grados y tender al sol",
        base_points=10,
        due_date=today + datetime.timedelta(days=4)
    )
    if t10_list:
        created_chores_count += len(t10_list)
        print(f"      [📅] Tarea futura: \"{t10_list[0]['title']}\" (en 4 días, asignada a @{ainoa['nickname']})")

    # ── 6. SERIES RECURRENTES (Recurrence WEEKLY con materialización finita) ──
    # K) Serie Semanal: Sacar cubos de basura por la noche (Javier, 4 semanas)
    t11_list = create_chore_item(
        creator_user=miguel,
        assignee_user=javier,
        title="Bajar basura orgánica y envases antes de las 22h",
        description="Turno rotatorio semanal de bajada de residuos",
        base_points=10,
        due_date=today,
        recurrence="WEEKLY",
        occurrences=4
    )
    if t11_list:
        created_chores_count += len(t11_list)
        print(f"      [🔁] Serie semanal creada: \"{t11_list[0]['title']}\" ({len(t11_list)} repeticiones para @{javier['nickname']})")

    # L) Serie Semanal: Limpieza general de sábado (Carmen, 3 semanas)
    t12_list = create_chore_item(
        creator_user=miguel,
        assignee_user=carmen,
        title="Limpieza a fondo del salón y comedor común",
        description="Desempolvar estantes, sacudir sofás y fregar",
        base_points=20,
        due_date=today + datetime.timedelta(days=3),
        recurrence="WEEKLY",
        occurrences=3
    )
    if t12_list:
        created_chores_count += len(t12_list)
        print(f"      [🔁] Serie semanal creada: \"{t12_list[0]['title']}\" ({len(t12_list)} repeticiones para @{carmen['nickname']})")

    time.sleep(0.1)
    print(f"\n  [✔] {created_chores_count} Tareas creadas/procesadas para \"{target_home_name}\" con éxito.\n")
    return created_chores_count
