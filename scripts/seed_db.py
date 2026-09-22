#!/usr/bin/env python3
"""
seed_db.py — Colivi Database Seeder
====================================
Popula la base de datos con usuarios host, alojamientos y anuncios realistas
distribuidos por las principales ciudades de España.

Uso:
    cd scripts/apiTester
    python seed_db.py

Requisitos:
    - El backend debe estar corriendo en http://localhost:8080
    - Una cuenta ADMIN activa (admin@example.com / admin123)
    - pip install requests (ya disponible en el entorno del proyecto)

El script es IDEMPOTENTE en cuanto a hosts: si el registro falla con 409
(email ya existe), intenta hacer login directamente.
"""

import sys
import time
import requests
from typing import Optional

# ── Configuración ─────────────────────────────────────────────────────

BASE_URL = "http://localhost:8080"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

# ── Datos realistas para el seed ──────────────────────────────────────

HOSTS = [
    # RegisterRequest fields: nickname, email, password, firstName, lastName1 (optional), lastName2 (optional), phone (optional)
    {"email": "carlos.ruiz@colivi-seed.com",   "password": "Seed1234!", "nickname": "carlos_ruiz",   "firstName": "Carlos",   "lastName1": "Ruiz",       "phone": "+34600111001"},
    {"email": "maria.lopez@colivi-seed.com",   "password": "Seed1234!", "nickname": "maria_lopez",   "firstName": "María",    "lastName1": "López",      "phone": "+34600111002"},
    {"email": "andres.pena@colivi-seed.com",   "password": "Seed1234!", "nickname": "andres_pena",   "firstName": "Andrés",   "lastName1": "Peña",       "phone": "+34600111003"},
    {"email": "lucia.garcia@colivi-seed.com",  "password": "Seed1234!", "nickname": "lucia_garcia",  "firstName": "Lucía",    "lastName1": "García",     "phone": "+34600111004"},
    {"email": "pablo.martinez@colivi-seed.com","password": "Seed1234!", "nickname": "pablo_martinez","firstName": "Pablo",    "lastName1": "Martínez",   "phone": "+34600111005"},
]

# Ciudades españolas con coordenadas reales de barrios céntricos
ACCOMMODATIONS_DATA = [
    # ── Madrid ──────────────────────────────────────────────────────────
    {
        "address": "Calle Gran Vía 45, 3º Izquierda", "city": "Madrid", "province": "Madrid", "country": "España",
        "latitude": 40.4200, "longitude": -3.7025,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 110,
        "amenities": ["WIFI", "HEATING", "ELEVATOR"],
        "listings": [
            {"title": "Habitación luminosa en Gran Vía", "description": "Habitación doble con vistas a la Gran Vía, zona céntrica y bien comunicada. Ideal para estudiantes o profesionales.", "pricePerMonth": 680, "securityDeposit": 680, "rentalType": "ROOM"},
            {"title": "Habitación individual junto al Callao", "description": "Pequeña habitación individual en piso compartido. Ambiente tranquilo y compañeros de piso respectuosos.", "pricePerMonth": 550, "securityDeposit": 550, "rentalType": "ROOM"},
        ],
    },
    {
        "address": "Calle Fuencarral 12, 1º Derecha", "city": "Madrid", "province": "Madrid", "country": "España",
        "latitude": 40.4225, "longitude": -3.7005,
        "totalRooms": 3, "freeRooms": 1, "totalBathrooms": 1, "squareMeters": 85,
        "amenities": ["WIFI", "HEATING"],
        "listings": [
            {"title": "Habitación en Malasaña, piso moderno", "description": "Habitación en el corazón de Malasaña. Piso reformado con cocina equipada y salón compartido.", "pricePerMonth": 720, "securityDeposit": 720, "rentalType": "ROOM"},
        ],
    },
    {
        "address": "Calle Alcalá 88, 5º C", "city": "Madrid", "province": "Madrid", "country": "España",
        "latitude": 40.4182, "longitude": -3.6892,
        "totalRooms": 5, "freeRooms": 3, "totalBathrooms": 2, "squareMeters": 140,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "AIR_CONDITIONING"],
        "listings": [
            {"title": "Piso completo cerca de Retiro", "description": "Luminoso piso de 5 habitaciones con terraza privada. A 10 minutos del Parque del Retiro.", "pricePerMonth": 1850, "securityDeposit": 1850, "rentalType": "ENTIRE_PLACE"},
        ],
    },
    {
        "address": "Calle Bravo Murillo 203, 2º B", "city": "Madrid", "province": "Madrid", "country": "España",
        "latitude": 40.4551, "longitude": -3.7025,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 95,
        "amenities": ["WIFI", "HEATING", "ELEVATOR"],
        "listings": [
            {"title": "Habitación amplia en Tetuán", "description": "Habitación tranquila en barrio residencial. Metro Tetuán a 5 minutos. Compañeros de piso jóvenes y ordenados.", "pricePerMonth": 620, "securityDeposit": 620, "rentalType": "ROOM"},
            {"title": "Habitación doble con escritorio en Tetuán", "description": "Ideal para teletrabajar. Mesa de trabajo, estantería y mucha luz natural.", "pricePerMonth": 650, "securityDeposit": 650, "rentalType": "ROOM"},
        ],
    },
    # ── Barcelona ────────────────────────────────────────────────────────
    {
        "address": "Carrer de Provença 234, Pral 1ª", "city": "Barcelona", "province": "Barcelona", "country": "España",
        "latitude": 41.3947, "longitude": 2.1625,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 120,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "BALCONY"],
        "listings": [
            {"title": "Habitación en el Eixample, zona Sagrada Família", "description": "Precioso piso modernista reformado. A 5 minutos de la Sagrada Família y con balcón compartido.", "pricePerMonth": 820, "securityDeposit": 820, "rentalType": "ROOM"},
            {"title": "Habitación doble con baño privado en Eixample", "description": "Habitación con baño privado en piso señorial. Zona muy bien comunicada con metro y bus.", "pricePerMonth": 950, "securityDeposit": 950, "rentalType": "ROOM"},
        ],
    },
    {
        "address": "Carrer de Blai 8, 3º 2ª", "city": "Barcelona", "province": "Barcelona", "country": "España",
        "latitude": 41.3755, "longitude": 2.1630,
        "totalRooms": 3, "freeRooms": 1, "totalBathrooms": 1, "squareMeters": 75,
        "amenities": ["WIFI", "HEATING"],
        "listings": [
            {"title": "Habitación en el Poble Sec", "description": "Barrio bohemio y animado. Calle Blai, famosa por las pintxos. Piso coqueto con terraza.", "pricePerMonth": 780, "securityDeposit": 780, "rentalType": "ROOM"},
        ],
    },
    {
        "address": "Avinguda Diagonal 490, 8º A", "city": "Barcelona", "province": "Barcelona", "country": "España",
        "latitude": 41.3940, "longitude": 2.1521,
        "totalRooms": 6, "freeRooms": 4, "totalBathrooms": 3, "squareMeters": 180,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "AIR_CONDITIONING", "BALCONY"],
        "listings": [
            {"title": "Piso entero de lujo en Diagonal", "description": "Espectacular piso con vistas panorámicas a la ciudad. Zona Les Corts, tranquila y exclusiva.", "pricePerMonth": 3200, "securityDeposit": 3200, "rentalType": "ENTIRE_PLACE"},
        ],
    },
    # ── Valencia ─────────────────────────────────────────────────────────
    {
        "address": "Carrer de Colom 14, 2º 3ª", "city": "Valencia", "province": "Valencia", "country": "España",
        "latitude": 39.4702, "longitude": -0.3768,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 100,
        "amenities": ["WIFI", "AIR_CONDITIONING", "BALCONY"],
        "listings": [
            {"title": "Habitación en el Carme, centro histórico", "description": "En el precioso barrio del Carme, rodeado de galerías y restaurantes. Piso reformado con mucho encanto.", "pricePerMonth": 590, "securityDeposit": 590, "rentalType": "ROOM"},
            {"title": "Habitación para profesional en Valencia centro", "description": "Zona tranquila y luminosa. Cocina equipada con todo lo necesario. Muy cerca de la Lonja de la Seda.", "pricePerMonth": 560, "securityDeposit": 560, "rentalType": "ROOM"},
        ],
    },
    {
        "address": "Calle Poeta Querol 7, 4º B", "city": "Valencia", "province": "Valencia", "country": "España",
        "latitude": 39.4688, "longitude": -0.3758,
        "totalRooms": 3, "freeRooms": 1, "totalBathrooms": 1, "squareMeters": 80,
        "amenities": ["WIFI", "AIR_CONDITIONING"],
        "listings": [
            {"title": "Piso compartido cerca de la Catedral", "description": "A dos pasos de la Catedral y el Mercado Central. Ideal para conocer Valencia desde el primer día.", "pricePerMonth": 510, "securityDeposit": 510, "rentalType": "ROOM"},
        ],
    },
    # ── Sevilla ───────────────────────────────────────────────────────────
    {
        "address": "Calle Sierpes 55, 3º A", "city": "Sevilla", "province": "Sevilla", "country": "España",
        "latitude": 37.3891, "longitude": -5.9923,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 115,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING"],
        "listings": [
            {"title": "Habitación en el centro de Sevilla", "description": "Calle Sierpes, la arteria comercial de Sevilla. A un paso de la Catedral y el Alcázar.", "pricePerMonth": 540, "securityDeposit": 540, "rentalType": "ROOM"},
            {"title": "Habitación espaciosa en Sevilla centro", "description": "Piso clásico sevillano con patio interior. Convivencia tranquila. Se admiten mascotas pequeñas.", "pricePerMonth": 500, "securityDeposit": 500, "rentalType": "ROOM"},
        ],
    },
    {
        "address": "Avenida de la Constitución 10, 1º Izq", "city": "Sevilla", "province": "Sevilla", "country": "España",
        "latitude": 37.3861, "longitude": -5.9929,
        "totalRooms": 5, "freeRooms": 3, "totalBathrooms": 2, "squareMeters": 135,
        "amenities": ["WIFI", "AIR_CONDITIONING", "ELEVATOR"],
        "listings": [
            {"title": "Piso completo frente a la Giralda", "description": "Vistas únicas a la Giralda desde el salón. Piso histórico completamente equipado.", "pricePerMonth": 1600, "securityDeposit": 1600, "rentalType": "ENTIRE_PLACE"},
        ],
    },
    # ── Bilbao ────────────────────────────────────────────────────────────
    {
        "address": "Gran Vía Don Diego López de Haro 45, 6º C", "city": "Bilbao", "province": "Vizcaya", "country": "España",
        "latitude": 43.2627, "longitude": -2.9253,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 105,
        "amenities": ["WIFI", "HEATING", "ELEVATOR"],
        "listings": [
            {"title": "Habitación en la Gran Vía de Bilbao", "description": "Elegante edificio en el corazón de Bilbao. Metro Gran Vía a 2 minutos. Ambiente tranquilo y profesional.", "pricePerMonth": 650, "securityDeposit": 650, "rentalType": "ROOM"},
            {"title": "Habitación amplia con parking en Bilbao", "description": "Incluye plaza de garaje. Ideal para quien se desplace en coche. Piso espacioso con dos baños.", "pricePerMonth": 720, "securityDeposit": 720, "rentalType": "ROOM"},
        ],
    },
    # ── Zaragoza ──────────────────────────────────────────────────────────
    {
        "address": "Paseo de la Independencia 22, 3º A", "city": "Zaragoza", "province": "Zaragoza", "country": "España",
        "latitude": 41.6488, "longitude": -0.8891,
        "totalRooms": 4, "freeRooms": 3, "totalBathrooms": 2, "squareMeters": 100,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING"],
        "listings": [
            {"title": "Habitación en el Paseo de la Independencia", "description": "El bulevar más exclusivo de Zaragoza. Piso luminoso con vistas al paseo arbolado.", "pricePerMonth": 480, "securityDeposit": 480, "rentalType": "ROOM"},
            {"title": "Habitación doble en Zaragoza centro", "description": "Barrio de La Magdalena, lleno de vida y gastronomía. Compañeros jóvenes y respetuosos.", "pricePerMonth": 460, "securityDeposit": 460, "rentalType": "ROOM"},
            {"title": "Piso moderno cerca del Pilar", "description": "A 5 minutos andando de la Basílica del Pilar. Recién reformado con electrodomésticos nuevos.", "pricePerMonth": 450, "securityDeposit": 450, "rentalType": "ROOM"},
        ],
    },
    # ── Málaga ────────────────────────────────────────────────────────────
    {
        "address": "Calle Larios 8, 2º Derecha", "city": "Málaga", "province": "Málaga", "country": "España",
        "latitude": 36.7213, "longitude": -4.4218,
        "totalRooms": 3, "freeRooms": 2, "totalBathrooms": 1, "squareMeters": 80,
        "amenities": ["WIFI", "AIR_CONDITIONING", "BALCONY"],
        "listings": [
            {"title": "Habitación en la Calle Larios, Málaga", "description": "La calle más famosa de Málaga. Piso reformado con mucha luz. Ideal para disfrutar del clima malagueño.", "pricePerMonth": 610, "securityDeposit": 610, "rentalType": "ROOM"},
            {"title": "Habitación individual en el centro histórico", "description": "Rodeado de museos, restaurantes y bares de tapas. Ambiente cosmopolita y multicultural.", "pricePerMonth": 570, "securityDeposit": 570, "rentalType": "ROOM"},
        ],
    },
    # ── Salamanca ────────────────────────────────────────────────────────
    {
        "address": "Plaza Mayor 5, 1º B", "city": "Salamanca", "province": "Salamanca", "country": "España",
        "latitude": 40.9651, "longitude": -5.6639,
        "totalRooms": 5, "freeRooms": 3, "totalBathrooms": 2, "squareMeters": 130,
        "amenities": ["WIFI", "HEATING"],
        "listings": [
            {"title": "Habitación con vistas a la Plaza Mayor", "description": "Ubicación inigualable frente a la Plaza Mayor. Piso de estudiantes universitarios. Ambiente muy animado.", "pricePerMonth": 490, "securityDeposit": 490, "rentalType": "ROOM"},
            {"title": "Habitación cerca de la Universidad de Salamanca", "description": "A 3 minutos andando de la Universidad. Compañeros de Erasmus bienvenidos. Piso limpio y organizado.", "pricePerMonth": 450, "securityDeposit": 450, "rentalType": "ROOM"},
            {"title": "Piso compartido para universitarios en Salamanca", "description": "Perfecto para el año académico. Zona histórica declarada Patrimonio de la Humanidad.", "pricePerMonth": 430, "securityDeposit": 430, "rentalType": "ROOM"},
        ],
    },
    # ── Granada ──────────────────────────────────────────────────────────
    {
        "address": "Calle Elvira 42, 2º C", "city": "Granada", "province": "Granada", "country": "España",
        "latitude": 37.1773, "longitude": -3.5986,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 95,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING"],
        "listings": [
            {"title": "Habitación en el Albaicín, Granada", "description": "El barrio árabe más famoso de España, con vistas a la Alhambra desde la azotea. Ambiente mágico.", "pricePerMonth": 520, "securityDeposit": 520, "rentalType": "ROOM"},
            {"title": "Habitación para estudiantes en Granada centro", "description": "Granada, ciudad universitaria por excelencia. Ideal para estudiantes. Tapas gratuitas en cada bar.", "pricePerMonth": 480, "securityDeposit": 480, "rentalType": "ROOM"},
        ],
    },
    # ── San Sebastián ────────────────────────────────────────────────────
    {
        "address": "Calle Mayor 18, 4º Izquierda", "city": "San Sebastián", "province": "Guipúzcoa", "country": "España",
        "latitude": 43.3183, "longitude": -1.9812,
        "totalRooms": 3, "freeRooms": 1, "totalBathrooms": 1, "squareMeters": 75,
        "amenities": ["WIFI", "HEATING"],
        "listings": [
            {"title": "Habitación en la Parte Vieja de San Sebastián", "description": "En el corazón de la Parte Vieja, rodeado de las mejores sidrerías y pintxos del mundo.", "pricePerMonth": 850, "securityDeposit": 850, "rentalType": "ROOM"},
        ],
    },
    # ── Valladolid ───────────────────────────────────────────────────────
    {
        "address": "Calle Santiago 10, 3º B", "city": "Valladolid", "province": "Valladolid", "country": "España",
        "latitude": 41.6523, "longitude": -4.7245,
        "totalRooms": 4, "freeRooms": 2, "totalBathrooms": 2, "squareMeters": 98,
        "amenities": ["WIFI", "HEATING", "ELEVATOR"],
        "listings": [
            {"title": "Habitación amplia en Valladolid centro", "description": "Piso céntrico y bien comunicado. Ideal para profesionales que buscan calidad de vida a buen precio.", "pricePerMonth": 410, "securityDeposit": 410, "rentalType": "ROOM"},
            {"title": "Habitación individual en el casco histórico", "description": "Ambiente universitario y cultural. Cerca de museos y zonas de tapas. Compañeros tranquilos.", "pricePerMonth": 380, "securityDeposit": 380, "rentalType": "ROOM"},
        ],
    },
    # ── Alicante ─────────────────────────────────────────────────────────
    {
        "address": "Avenida Maisonnave 22, 5º A", "city": "Alicante", "province": "Alicante", "country": "España",
        "latitude": 38.3452, "longitude": -0.4815,
        "totalRooms": 4, "freeRooms": 3, "totalBathrooms": 2, "squareMeters": 108,
        "amenities": ["WIFI", "AIR_CONDITIONING", "BALCONY", "PETS_ALLOWED"],
        "listings": [
            {"title": "Habitación con balcón en Alicante", "description": "Disfruta del sol mediterráneo desde tu balcón privado. Se admiten mascotas. Ambiente familiar.", "pricePerMonth": 540, "securityDeposit": 540, "rentalType": "ROOM"},
            {"title": "Habitación luminosa en el centro de Alicante", "description": "Piso moderno a 10 minutos de la playa del Postiguet. Perfecto para amantes del mar.", "pricePerMonth": 510, "securityDeposit": 510, "rentalType": "ROOM"},
            {"title": "Piso completo en Alicante, ideal familias", "description": "Piso de 4 habitaciones totalmente equipado. Garaje incluido. Comunidad tranquila.", "pricePerMonth": 1400, "securityDeposit": 1400, "rentalType": "ENTIRE_PLACE"},
        ],
    },
]


# ── Helpers HTTP ──────────────────────────────────────────────────────

def post(endpoint: str, payload: dict, token: Optional[str] = None, expected: int = 200) -> dict:
    """Realiza un POST y devuelve el JSON de respuesta."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = requests.post(f"{BASE_URL}{endpoint}", json=payload, headers=headers, timeout=15)
    if r.status_code != expected:
        raise RuntimeError(f"POST {endpoint} → {r.status_code}: {r.text[:300]}")
    return r.json() if r.text else {}


# ── Pasos del seeder ─────────────────────────────────────────────────

def ensure_host_token(host: dict) -> str:
    """Registra o hace login de un host y devuelve su access token."""
    try:
        data = post("/api/v1/auth/register", {
            "email":     host["email"],
            "password":  host["password"],
            "nickname":  host["nickname"],
            "firstName": host["firstName"],
            "lastName1": host["lastName1"],  # ← campo exacto del RegisterRequest.java
            "phone":     host["phone"],
        }, expected=200)
        token = data["accessToken"]
        print(f"  [+] Host registrado: {host['nickname']}")
    except RuntimeError as e:
        if "409" in str(e) or "400" in str(e):
            data = post("/api/v1/auth/login", {
                "email":    host["email"],
                "password": host["password"],
            }, expected=200)
            token = data["accessToken"]
            print(f"  [~] Host ya existía, login OK: {host['nickname']}")
        else:
            raise
    return token


def create_accommodation(acc_data: dict, token: str) -> str:
    """Crea un alojamiento y devuelve su ID."""
    payload = {
        "address":        acc_data["address"],
        "city":           acc_data["city"],
        "province":       acc_data["province"],
        "country":        acc_data["country"],
        "latitude":       acc_data["latitude"],
        "longitude":      acc_data["longitude"],
        "totalRooms":     acc_data["totalRooms"],
        "freeRooms":      acc_data["freeRooms"],
        "totalBathrooms": acc_data["totalBathrooms"],
        "squareMeters":   acc_data["squareMeters"],
        "amenities":      acc_data["amenities"],
    }
    data = post("/api/v1/accommodation", payload, token=token, expected=201)
    acc_id = data["id"]
    print(f"    [+] Alojamiento creado: {acc_data['address'][:40]}… → {acc_id}")
    return acc_id


def create_listing(listing_data: dict, acc_id: str, token: str) -> str:
    """Crea un anuncio vinculado a un alojamiento y devuelve su ID."""
    payload = {
        "accommodationId": acc_id,
        "title":           listing_data["title"],
        "description":     listing_data["description"],
        # BigDecimal en Java: Python int/float se serializa bien como número JSON
        "pricePerMonth":   listing_data["pricePerMonth"],
        "securityDeposit": listing_data["securityDeposit"],
        # RentalType enum: "ROOM" | "ENTIRE_PLACE"  (exacto, case-sensitive)
        "rentalType":      listing_data["rentalType"],
        # selectedImages es opcional (List<UUID>); lo omitimos en el seed
    }
    # El controlador devuelve 201 Created (HttpStatus.CREATED)
    data = post("/api/v1/listings", payload, token=token, expected=201)
    listing_id = data["id"]
    print(f"      [+] Anuncio: '{listing_data['title'][:45]}…' → {listing_id}")
    return listing_id


# ── Main ─────────────────────────────────────────────────────────────

def main():
    print("=" * 65)
    print("   COLIVI — SCRIPT DE SEEDING DE BASE DE DATOS")
    print("=" * 65)
    print(f"  API: {BASE_URL}\n")

    # Distribuir alojamientos entre los hosts en round-robin
    total_accommodations = len(ACCOMMODATIONS_DATA)
    total_hosts = len(HOSTS)
    total_listings = sum(len(a["listings"]) for a in ACCOMMODATIONS_DATA)

    print(f"  Hosts a crear:          {total_hosts}")
    print(f"  Alojamientos a crear:   {total_accommodations}")
    print(f"  Anuncios a crear:       {total_listings}")
    print()

    # 1. Obtener tokens de todos los hosts
    print("── Paso 1/3: Autenticar hosts ──────────────────────────────")
    tokens = []
    for host in HOSTS:
        token = ensure_host_token(host)
        tokens.append(token)
        time.sleep(0.2)  # respetar rate-limits

    # 2. Crear alojamientos y anuncios
    print("\n── Paso 2/3: Crear alojamientos y anuncios ─────────────────")
    created_acc = 0
    created_listings = 0

    for idx, acc_data in enumerate(ACCOMMODATIONS_DATA):
        # Asignar host en round-robin
        token = tokens[idx % total_hosts]
        host_name = HOSTS[idx % total_hosts]["nickname"]

        print(f"\n  [{idx + 1}/{total_accommodations}] {acc_data['city']} — host: {host_name}")

        try:
            acc_id = create_accommodation(acc_data, token)
            created_acc += 1
        except RuntimeError as e:
            print(f"  [-] ERROR creando alojamiento: {e}")
            continue

        for listing_data in acc_data["listings"]:
            try:
                create_listing(listing_data, acc_id, token)
                created_listings += 1
                time.sleep(0.15)
            except RuntimeError as e:
                print(f"      [-] ERROR creando anuncio: {e}")

        time.sleep(0.3)

    # 3. Resumen
    print("\n── Paso 3/3: Resumen ────────────────────────────────────────")
    print(f"\n  ✓ Alojamientos creados: {created_acc}/{total_accommodations}")
    print(f"  ✓ Anuncios creados:     {created_listings}/{total_listings}")
    print()
    if created_acc == total_accommodations and created_listings == total_listings:
        print("  🎉 Seeding completado sin errores.")
    else:
        print("  ⚠️  Seeding completado con algunos errores. Revisa los logs.")
    print("=" * 65)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[!] Seeding cancelado por el usuario.")
        sys.exit(0)
    except Exception as exc:
        print(f"\n[FATAL] {exc}")
        sys.exit(1)
