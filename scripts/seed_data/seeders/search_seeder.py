#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
search_seeder.py — User Search History & Analytics Seeder
"""

import random
import time
from typing import Any, Dict, List

from ..api_client import ApiClient
from ..data_fixtures import SEARCH_QUERIES


def seed_search_histories(
    client: ApiClient,
    users: List[Dict[str, Any]],
) -> int:
    """
    Simula consultas de búsqueda realizadas por los usuarios autenticados,
    poblando la tabla user_search_histories para el motor de recomendaciones.
    """
    print("\n[FASE 6/6] Generando historiales de búsqueda de usuarios para analítica y recomendaciones...")

    total_searches_performed = 0

    for user in users:
        token = user.get("token")
        if not token:
            continue

        # Cada usuario realiza entre 2 y 4 búsquedas variadas
        num_searches = random.randint(2, 4)
        queries = random.sample(SEARCH_QUERIES, min(num_searches, len(SEARCH_QUERIES)))

        for query in queries:
            params = {
                "city": query["city"],
                "maxPrice": str(query["maxPrice"]),
                "rentalType": query["rentalType"],
            }
            try:
                client.get("/api/v1/listings", params=params, token=token, expected=200)
                total_searches_performed += 1
            except Exception:
                pass

        time.sleep(0.02)

    print(f"  [✔] {total_searches_performed} Búsquedas registradas en el historial de los usuarios.\n")
    return total_searches_performed
