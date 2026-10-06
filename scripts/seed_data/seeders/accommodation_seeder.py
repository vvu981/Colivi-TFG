#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
accommodation_seeder.py — Accommodations, Images & Listings Seeder
"""

import os
import time
from typing import Any, Dict, List, Tuple

from ..api_client import ApiClient
from ..data_fixtures import ACCOMMODATIONS_LOCATIONS


def seed_accommodations_and_listings(
    client: ApiClient,
    users: List[Dict[str, Any]],
    available_images: List[str]
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Crea alojamientos en diferentes capitales con clusters de coordenadas,
    sube fotos reales y publica anuncios completos y por habitaciones.
    """
    print("\n[FASE 2/5] Creando alojamientos, subiendo fotos y publicando anuncios...")

    created_accommodations: List[Dict[str, Any]] = []
    created_listings: List[Dict[str, Any]] = []

    total_locations = len(ACCOMMODATIONS_LOCATIONS)
    img_pointer = 0

    # Mapeo de usuarios por ciudad para asignar propietarios locales coherentes
    users_by_city: Dict[str, List[Dict[str, Any]]] = {}
    for u in users:
        city = u.get("city", "Madrid")
        users_by_city.setdefault(city, []).append(u)

    for idx, acc_data in enumerate(ACCOMMODATIONS_LOCATIONS, 1):
        city = acc_data["city"]
        city_users = users_by_city.get(city, users)
        owner = city_users[(idx - 1) % len(city_users)]
        token = owner["token"]

        acc_payload = {
            "address": acc_data["address"],
            "city": acc_data["city"],
            "province": acc_data["province"],
            "country": acc_data["country"],
            "latitude": acc_data["latitude"],
            "longitude": acc_data["longitude"],
            "totalRooms": acc_data["rooms"],
            "freeRooms": acc_data["free_rooms"],
            "totalBathrooms": acc_data["baths"],
            "squareMeters": acc_data["sqm"],
            "amenities": acc_data["amenities"],
        }

        acc_res = client.post("/api/v1/accommodation", acc_payload, token=token, expected=201)
        acc_id = acc_res["id"]

        print(f"  [+] [{idx:02d}/{total_locations}] Alojamiento en {city} ({acc_data['name_hint']})")
        print(f"      Propietario: {owner['email']} | ID: {acc_id}")

        # Subir entre 3 y 4 fotos reales para este alojamiento
        uploaded_image_ids: List[str] = []
        num_photos = 3 if len(available_images) < 4 else 4

        for p_idx in range(num_photos):
            img_file = available_images[img_pointer % len(available_images)]
            img_pointer += 1
            try:
                img_res = client.upload_file(f"/api/v1/accommodation/{acc_id}/images", img_file, token=token, expected=200)
                if "images" in img_res and len(img_res["images"]) > 0:
                    latest_img = img_res["images"][-1]
                    uploaded_image_ids.append(latest_img["id"])
            except Exception as e:
                print(f"      [!] Error subiendo foto {os.path.basename(img_file)}: {e}")

        # Publicar anuncios asociados
        for listing_template in acc_data["listings"]:
            selected_images = uploaded_image_ids if listing_template["rentalType"] == "ENTIRE_PLACE" else uploaded_image_ids[:2]

            listing_payload = {
                "accommodationId": acc_id,
                "title": listing_template["title"],
                "description": listing_template["description"],
                "pricePerMonth": listing_template["price"],
                "securityDeposit": listing_template["deposit"],
                "rentalType": listing_template["rentalType"],
                "selectedImages": selected_images if selected_images else None,
            }

            list_res = client.post("/api/v1/listings", listing_payload, token=token, expected=201)
            listing_id = list_res["id"]

            created_listings.append({
                "id": listing_id,
                "accommodation_id": acc_id,
                "host_id": owner["id"],
                "host_email": owner["email"],
                "title": listing_template["title"],
                "price": listing_template["price"],
                "deposit": listing_template["deposit"],
                "rental_type": listing_template["rentalType"],
                "city": city,
            })
            print(f"      • Anuncio [{listing_template['rentalType']}]: {listing_template['title'][:40]}... ({listing_template['price']}€/mes) -> {listing_id}")

        created_accommodations.append({
            "id": acc_id,
            "owner": owner,
            "city": city,
            "address": acc_data["address"],
            "image_ids": uploaded_image_ids,
        })
        time.sleep(0.08)

    print(f"\n  [✔] {len(created_accommodations)} Alojamientos y {len(created_listings)} Anuncios creados exitosamente.\n")
    return created_accommodations, created_listings
