#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
api_client.py — Robust HTTP Client and Database Utilities for Colivi
"""

import os
import subprocess
import time
from typing import Any, Dict, List, Optional, Union
import requests

from .config import BASE_URL, REQUEST_TIMEOUT


class ApiClient:
    """Cliente HTTP con autenticación Bearer, reintentos y soporte de subida de archivos."""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()

    def check_health(self) -> bool:
        """Comprueba si el backend está activo y respondiendo."""
        try:
            r = self.session.get(f"{self.base_url}/api/v1/listings", timeout=5)
            return r.status_code in (200, 401, 403)
        except Exception:
            return False

    def post(
        self,
        endpoint: str,
        payload: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None,
        expected: Union[int, List[int]] = 200,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        return self._request("POST", endpoint, json_data=payload, params=params, token=token, expected=expected, max_retries=max_retries)

    def put(
        self,
        endpoint: str,
        payload: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None,
        expected: Union[int, List[int]] = 200,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        return self._request("PUT", endpoint, json_data=payload, token=token, expected=expected, max_retries=max_retries)

    def patch(
        self,
        endpoint: str,
        payload: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None,
        expected: Union[int, List[int]] = 200,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        return self._request("PATCH", endpoint, json_data=payload, params=params, token=token, expected=expected, max_retries=max_retries)

    def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None,
        expected: Union[int, List[int]] = 200,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        return self._request("GET", endpoint, params=params, token=token, expected=expected, max_retries=max_retries)

    def delete(
        self,
        endpoint: str,
        token: Optional[str] = None,
        expected: Union[int, List[int]] = 204,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        return self._request("DELETE", endpoint, token=token, expected=expected, max_retries=max_retries)

    def upload_file(
        self,
        endpoint: str,
        file_path: str,
        field_name: str = "file",
        token: Optional[str] = None,
        method: str = "POST",
        expected: Union[int, List[int]] = (200, 201),
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """Sube un archivo como multipart/form-data usando POST o PATCH."""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        expected_statuses = [expected] if isinstance(expected, int) else list(expected)

        for attempt in range(1, max_retries + 1):
            try:
                with open(file_path, "rb") as f:
                    filename = os.path.basename(file_path)
                    content_type = "image/jpeg" if filename.lower().endswith((".jpg", ".jpeg")) else "image/png"
                    files = {field_name: (filename, f, content_type)}
                    r = self.session.request(method, url, files=files, headers=headers, timeout=REQUEST_TIMEOUT)

                if r.status_code in expected_statuses:
                    return r.json() if r.text else {}

                if attempt == max_retries:
                    raise RuntimeError(f"UPLOAD {endpoint} returned HTTP {r.status_code}: {r.text[:300]}")
            except (requests.RequestException, IOError) as e:
                if attempt == max_retries:
                    raise RuntimeError(f"UPLOAD {endpoint} error: {e}")
            time.sleep(0.3 * attempt)

        return {}

    def _request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None,
        expected: Union[int, List[int]] = 200,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        expected_statuses = [expected] if isinstance(expected, int) else list(expected)

        for attempt in range(1, max_retries + 1):
            try:
                r = self.session.request(
                    method=method,
                    url=url,
                    json=json_data,
                    params=params,
                    headers=headers,
                    timeout=REQUEST_TIMEOUT,
                )

                if r.status_code in expected_statuses:
                    return r.json() if r.text else {}

                # Si falló pero tenemos reintentos
                if attempt == max_retries:
                    raise RuntimeError(f"{method} {endpoint} returned HTTP {r.status_code}: {r.text[:400]}")
            except requests.RequestException as e:
                if attempt == max_retries:
                    raise RuntimeError(f"{method} {endpoint} network error: {e}")
            time.sleep(0.25 * attempt)

        return {}


# ── Utilidades Directas de Base de Datos ──────────────────────────────

def execute_sql(sql_command: str) -> bool:
    """Ejecuta una sentencia SQL directamente en PostgreSQL usando psql o docker compose."""
    pghost = os.environ.get("PGHOST", "postgres" if os.environ.get("IN_DOCKER") else "localhost")
    pguser = os.environ.get("PGUSER", "tfg_user")
    pgdb = os.environ.get("PGDATABASE", "tfg_db")
    commands = [
        ["psql", "-h", pghost, "-U", pguser, "-d", pgdb],
        ["docker", "compose", "exec", "-T", "postgres", "psql", "-U", "tfg_user", "-d", "tfg_db"],
        ["docker", "exec", "-i", "tfg_postgres", "psql", "-U", "tfg_user", "-d", "tfg_db"],
        ["psql", "-U", "tfg_user", "-d", "tfg_db", "-h", "localhost"],
    ]

    for cmd in commands:
        try:
            res = subprocess.run(cmd, input=sql_command, text=True, capture_output=True, timeout=15)
            if res.returncode == 0:
                return True
            else:
                if res.stderr:
                    print(f"      [DEBUG DB] {cmd[0]}: {res.stderr.strip()[:200]}")
        except Exception:
            continue

    return False


def wipe_database() -> bool:
    """Borra completamente los datos de la base de datos manteniendo el esquema Flyway."""
    truncate_sql = """
    TRUNCATE TABLE 
        reports,
        accommodation_reviews,
        booking_requests,
        messages,
        conversations,
        user_search_histories,
        listing_image_selection,
        accommodation_listing,
        accommodation_image,
        accommodation_amenity,
        accommodation,
        home_expense_participants,
        home_expenses,
        home_members,
        homes,
        chore_series_participants,
        chores,
        chore_series,
        activity_logs,
        audit_snapshot_log,
        "user"
    CASCADE;
    """
    return execute_sql(truncate_sql)


def promote_user_to_admin(email: str) -> bool:
    """Promueve un usuario a ADMIN en la base de datos."""
    sql = f"UPDATE \"user\" SET role = 'ADMIN' WHERE email = '{email}';"
    return execute_sql(sql)


def get_database_table_counts() -> Dict[str, int]:
    """Obtiene el conteo exacto de filas en cada una de las tablas del sistema."""
    tables = [
        "user",
        "user_search_histories",
        "accommodation",
        "accommodation_amenity",
        "accommodation_image",
        "accommodation_listing",
        "listing_image_selection",
        "booking_requests",
        "conversations",
        "messages",
        "accommodation_reviews",
        "homes",
        "home_members",
        "home_expenses",
        "home_expense_participants",
        "chore_series",
        "chores",
        "activity_logs",
        "audit_snapshot_log",
        "reports",
    ]

    queries = []
    for t in tables:
        tbl_name = f'"{t}"' if t == "user" else t
        queries.append(f"SELECT '{t}' AS tbl, count(*) AS cnt FROM {tbl_name};")
    sql_queries = "\n".join(queries)

    pghost = os.environ.get("PGHOST", "postgres" if os.environ.get("IN_DOCKER") else "localhost")
    pguser = os.environ.get("PGUSER", "tfg_user")
    pgdb = os.environ.get("PGDATABASE", "tfg_db")
    commands = [
        ["psql", "-h", pghost, "-U", pguser, "-d", pgdb, "-t", "-A", "-F", ":"],
        ["docker", "compose", "exec", "-T", "postgres", "psql", "-U", "tfg_user", "-d", "tfg_db", "-t", "-A", "-F", ":"],
        ["docker", "exec", "-i", "tfg_postgres", "psql", "-U", "tfg_user", "-d", "tfg_db", "-t", "-A", "-F", ":"],
        ["psql", "-U", "tfg_user", "-d", "tfg_db", "-h", "localhost", "-t", "-A", "-F", ":"],
    ]

    counts: Dict[str, int] = {}
    for cmd in commands:
        try:
            res = subprocess.run(cmd, input=sql_queries, text=True, capture_output=True, timeout=15)
            if res.returncode == 0 and res.stdout:
                for line in res.stdout.strip().split("\n"):
                    if ":" in line:
                        tbl, cnt = line.strip().split(":", 1)
                        try:
                            counts[tbl.strip()] = int(cnt.strip())
                        except ValueError:
                            pass
                if counts:
                    return counts
        except Exception:
            continue

    return counts
