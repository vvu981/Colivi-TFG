#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
user_seeder.py — User Registration, Authentication & Profile Seeder
"""

import time
from typing import Any, Dict, List, Tuple

from ..api_client import ApiClient, promote_user_to_admin
from ..data_fixtures import ADMIN_USERS, USERS_DATA


def seed_users(
    client: ApiClient,
    available_images: List[str]
) -> Tuple[Dict[str, Dict[str, Any]], List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    """
    Registra y autentica a los administradores y usuarios del sistema.
    Asigna fotos de perfil y retorna colecciones indexadas.
    """
    print("\n[FASE 1/5] Registrando y autenticando usuarios y administradores...")

    admins_by_email: Dict[str, Dict[str, Any]] = {}
    users_list: List[Dict[str, Any]] = []
    users_by_email: Dict[str, Dict[str, Any]] = {}

    # 1. Registrar y autenticar Administradores
    for admin_data in ADMIN_USERS:
        email = admin_data["email"]
        password = admin_data["password"]
        token = None

        reg_payload = {
            "email": email,
            "password": password,
            "nickname": admin_data["nickname"],
            "firstName": admin_data["firstName"],
            "lastName1": admin_data["lastName1"],
            "lastName2": admin_data["lastName2"],
            "phone": admin_data["phone"],
        }

        try:
            res = client.post("/api/v1/auth/register", reg_payload, expected=200)
            token = res.get("accessToken")
            print(f"  [+] Administrador registrado: {email} (Nick: @{admin_data['nickname']})")
        except RuntimeError as e:
            if "409" in str(e) or "400" in str(e):
                login_res = client.post("/api/v1/auth/login", {"email": email, "password": password}, expected=200)
                token = login_res.get("accessToken")
                print(f"  [~] Administrador existente: login OK -> {email}")
            else:
                raise e

        # Promover a ADMIN en base de datos
        promote_user_to_admin(email)

        # Re-login para refrescar JWT con claims actualizados
        try:
            login_res = client.post("/api/v1/auth/login", {"email": email, "password": password}, expected=200)
            token = login_res.get("accessToken") or token
        except Exception:
            pass

        # Obtener perfil y ID real
        user_id = None
        if token:
            try:
                profile = client.get("/api/v1/users/me", token=token, expected=200)
                user_id = profile.get("id")
            except Exception as e:
                print(f"      [!] Error obteniendo perfil de {email}: {e}")

        admin_record = {
            **admin_data,
            "id": user_id,
            "token": token,
            "role": "ADMIN",
        }
        admins_by_email[email] = admin_record
        users_by_email[email] = admin_record

    # 2. Registrar usuarios regulares
    img_idx = 0
    total_users = len(USERS_DATA)

    for idx, u in enumerate(USERS_DATA, 1):
        email = u["email"]
        password = u["password"]

        reg_payload = {
            "email": email,
            "password": password,
            "nickname": u["nickname"],
            "firstName": u["firstName"],
            "lastName1": u["lastName1"],
            "lastName2": u.get("lastName2"),
            "phone": u.get("phone"),
        }

        token = None

        try:
            res = client.post("/api/v1/auth/register", reg_payload, expected=200)
            token = res.get("accessToken")
            print(f"  [+] [{idx:02d}/{total_users}] Usuario registrado: {email} (@{u['nickname']})")
        except RuntimeError as e:
            if "409" in str(e) or "400" in str(e):
                login_res = client.post("/api/v1/auth/login", {"email": email, "password": password}, expected=200)
                token = login_res.get("accessToken")
                print(f"  [~] [{idx:02d}/{total_users}] Usuario existente: login OK -> {email}")
            else:
                raise e

        # Obtener perfil e ID real
        user_id = None
        if token:
            try:
                profile = client.get("/api/v1/users/me", token=token, expected=200)
                user_id = profile.get("id")
            except Exception as e:
                print(f"      [!] Error obteniendo perfil de {email}: {e}")

        # Subir foto de perfil usando las imágenes de prueba disponibles
        if token and available_images:
            img_file = available_images[img_idx % len(available_images)]
            img_idx += 1
            try:
                client.upload_file("/api/v1/users/me/profile-picture", img_file, token=token, method="PATCH", expected=200)
                # Re-login para refrescar el token con la nueva tokenVersion incrementada por JPA
                login_res = client.post("/api/v1/auth/login", {"email": email, "password": password}, expected=200)
                token = login_res.get("accessToken") or token
            except Exception:
                pass

        user_record = {
            **u,
            "id": user_id,
            "token": token,
            "role": "USER",
        }
        users_list.append(user_record)
        users_by_email[email] = user_record
        time.sleep(0.04)

    print(f"  [✔] {len(admins_by_email)} Administradores y {len(users_list)} Usuarios registrados y listos.\n")
    return admins_by_email, users_list, users_by_email
