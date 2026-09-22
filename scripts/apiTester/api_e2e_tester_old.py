import sys
import json
import base64
import random
import string
import time
import subprocess
import requests

# ==============================================================================
# CONFIGURACIÓN GENERAL Y VARIABLES GLOBALES
# ==============================================================================
BASE_URL = "http://localhost:8080"  # Ajusta si tu servidor corre en otro puerto/host
MAILPIT_URL = "http://localhost:8025" # Servidor SMTP local para capturar correos

# Deja las credenciales de Administrador aquí para que el script las use:
CORREO_ADMIN = "admin@example.com"  # <--- RELLENAR CON EL CORREO DEL ADMINISTRADOR
PASS_ADMIN = "admin123"            # <--- RELLENAR CON LA CONTRASEÑA DEL ADMINISTRADOR

def setup_admin():
    print("--- PASO 0: Setup Admin User ---")
    payload = {
        "nickname": "admin_test",
        "firstName": "Admin",
        "lastName1": "Test",
        "lastName2": "",
        "phone": "+34111111111",
        "email": CORREO_ADMIN,
        "password": PASS_ADMIN,
        "dateOfBirth": "1990-01-01",
        "gender": "OTHER"
    }
    # Register the admin (ignore if already registered)
    try:
        requests.post(f"{BASE_URL}/api/v1/auth/register", json=payload)
    except:
        pass
    # Promote admin via database directly (assuming running on host with docker)
    try:
        # La tabla se llama "user" (con comillas dobles porque user es palabra reservada en postgres)
        cmd = ["docker", "exec", "tfg_postgres", "psql", "-U", "tfg_user", "-d", "tfg_db", "-c", f'UPDATE "user" SET role = \'ADMIN\' WHERE email = \'{CORREO_ADMIN}\';']
        subprocess.run(cmd, check=True)
        print("[+] Admin user setup correctly via DB")
    except Exception as e:
        print(f"[-] Could not promote admin via DB: {e}")


# Deja las credenciales de Administrador aquí para que el script las use:
CORREO_ADMIN = "admin@example.com"  # <--- RELLENAR CON EL CORREO DEL ADMINISTRADOR
PASS_ADMIN = "admin123"            # <--- RELLENAR CON LA CONTRASEÑA DEL ADMINISTRADOR

# Variables globales para almacenar tokens e identificadores dinámicos
user_token = None
user_refresh_token = None
admin_token = None

user_id = None
accommodation_id = None
listing_id = None
image_id_1 = None
image_id_2 = None

# Generador de cadenas aleatorias para evitar conflictos al registrar el usuario
def get_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

# Helper para decodificar el payload del JWT de forma ligera y extraer el ID del usuario
def extract_id_from_jwt(token):
    try:
        parts = token.split('.')
        if len(parts) >= 2:
            payload = parts[1]
            payload += '=' * (-len(payload) % 4)
            decoded = base64.b64decode(payload).decode('utf-8')
            data = json.loads(decoded)
            return data.get('id')
    except Exception as e:
        print(f"[!] Error al extraer el ID de usuario del JWT: {e}")
    return None

# Helper para imprimir los detalles de la petición y comprobar la respuesta
def check_response(response, step_name, expected_status=200):
    print(f"\n--- PASO: {step_name} ---")
    print(f"URL: {response.request.method} {response.url}")
    print(f"Código de estado esperado: {expected_status} | Recibido: {response.status_code}")
    
    if response.status_code == expected_status or (isinstance(expected_status, list) and response.status_code in expected_status):
        print("[+] Éxito!")
        try:
            if response.text:
                print("Respuesta JSON:")
                print(json.dumps(response.json(), indent=2))
        except Exception:
            if response.text:
                print(f"Respuesta de texto plano: {response.text}")
        return True
    else:
        print(f"[-] ERROR: Respuesta inesperada del backend ({response.status_code})")
        print(f"Detalle de la respuesta: {response.text}")
        sys.exit(1)

# Helper para extraer el token de reactivación de Mailpit
def get_reactivation_token_from_mailpit(email):
    print(f"[i] Buscando el email de reactivación para '{email}' en Mailpit...")
    time.sleep(2)  # Pequeña espera para asegurar que el backend procese el envío
    
    try:
        url_messages = f"{MAILPIT_URL}/api/v1/messages"
        response = requests.get(url_messages)
        if response.status_code != 200:
            print(f"[!] Error al conectar con Mailpit API: {response.status_code}")
            return None
        
        data = response.json()
        messages = data.get("messages", [])
        
        for msg in messages:
            to_addresses = [t.get("Address") for t in msg.get("To", [])]
            if email in to_addresses and "Reactiva" in msg.get("Subject", ""):
                msg_id = msg.get("ID")
                url_detail = f"{MAILPIT_URL}/api/v1/message/{msg_id}"
                detail_resp = requests.get(url_detail)
                if detail_resp.status_code == 200:
                    detail_data = detail_resp.json()
                    body_text = detail_data.get("Text", "") + detail_data.get("HTML", "")
                    if "token=" in body_text:
                        parts = body_text.split("token=")
                        token = parts[1].split()[0].split('"')[0].split('&')[0].split('<')[0]
                        print(f"[+] Token de reactivación encontrado en el email: {token}")
                        return token.strip()
    except Exception as e:
        print(f"[!] Error al interactuar con Mailpit: {e}")
    return None

# ==============================================================================
# FUNCIONES DE PRUEBA
# ==============================================================================

# ──────────────────────────────────────────────────────────────────────────────
# 1. AUTH ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

def step_1_register_user():
    """1. Registra un nuevo usuario de prueba"""
    global user_id, user_token, user_refresh_token
    nickname = f"test_{get_random_string()}"
    email = f"{nickname}@example.com"
    password = "Password123!"
    
    register_payload = {
        "nickname": nickname,
        "email": email,
        "password": password,
        "firstName": "Test",
        "lastName1": "User",
        "lastName2": "E2E",
        "phone": "+34600112233"
    }
    
    url = f"{BASE_URL}/api/v1/auth/register"
    response = requests.post(url, json=register_payload)
    check_response(response, "Registro de Usuario", expected_status=200)
    
    user_token = response.json().get("accessToken")
    user_refresh_token = response.json().get("refreshToken")
    user_id = extract_id_from_jwt(user_token)
    print(f"[i] Usuario creado con ID: {user_id} e Email: {email}")
    
    return email, password

def step_2_login_user(email, password):
    """2. Realiza login con el usuario creado y guarda los Tokens"""
    global user_token, user_refresh_token
    login_payload = {
        "email": email,
        "password": password
    }
    
    url = f"{BASE_URL}/api/v1/auth/login"
    response = requests.post(url, json=login_payload)
    check_response(response, "Login de Usuario", expected_status=200)
    
    user_token = response.json().get("accessToken")
    user_refresh_token = response.json().get("refreshToken")
    print(f"[i] Token JWT y Refresh Token adquiridos correctamente.")

def step_3_refresh_token():
    """3. Refresca el Token JWT usando el Refresh Token"""
    global user_token, user_refresh_token
    refresh_payload = {
        "refreshToken": user_refresh_token
    }
    
    url = f"{BASE_URL}/api/v1/auth/refresh"
    response = requests.post(url, json=refresh_payload)
    check_response(response, "Refrescar Token", expected_status=200)
    
    user_token = response.json().get("accessToken")
    user_refresh_token = response.json().get("refreshToken")
    print(f"[i] Token JWT y Refresh Token refrescados correctamente.")

# ──────────────────────────────────────────────────────────────────────────────
# 2. USER ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

def step_4_update_profile():
    """4. Actualiza los datos de perfil no sensibles del usuario logueado"""
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    profile_payload = {
        "nickname": f"upd_{get_random_string()}",
        "firstName": "TestEdit",
        "lastName1": "UserEdit",
        "lastName2": "E2EEdit",
        "phone": "+34699999999",
        "profilePicUrl": "https://example.com/pic.jpg"
    }
    
    url = f"{BASE_URL}/api/v1/users/me/profile"
    response = requests.patch(url, json=profile_payload, headers=headers)
    check_response(response, "Actualizar Perfil (Datos No Sensibles)", expected_status=200)

def step_5_update_credentials_and_relogin(email):
    """5. Cambia el correo/contraseña y realiza login con las nuevas credenciales"""
    global user_token, user_refresh_token
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    new_password = "NewPassword123!"
    new_email = f"new_{email}"
    
    credentials_payload = {
        "currentPassword": "Password123!",
        "newEmail": new_email,
        "newPassword": new_password
    }
    
    url = f"{BASE_URL}/api/v1/users/me/credentials"
    response = requests.patch(url, json=credentials_payload, headers=headers)
    check_response(response, "Actualizar Credenciales (Datos Sensibles)", expected_status=204)
    
    # Realizar login con las nuevas credenciales para comprobar el cambio
    step_2_login_user(new_email, new_password)
    return new_email, new_password

def step_6_user_logout_and_relogin(email, password):
    """6. Hace logout y vuelve a iniciar sesión"""
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    url = f"{BASE_URL}/api/v1/users/me/logout"
    response = requests.patch(url, headers=headers)
    check_response(response, "Cerrar Sesión (Logout)", expected_status=204)
    
    # Volver a iniciar sesión para continuar las pruebas con un token válido
    step_2_login_user(email, password)

# ──────────────────────────────────────────────────────────────────────────────
# 3. ACCOMMODATION ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

def step_7_create_accommodation():
    """7. Crea un alojamiento físico asociado al usuario logueado"""
    global accommodation_id
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    accommodation_payload = {
        "address": "Calle Gran Via 12",
        "totalRooms": 4,
        "totalBathrooms": 2,
        "freeRooms": 2,
        "squareMeters": 120,
        "city": "Madrid",
        "country": "Spain",
        "province": "Madrid",
        "latitude": 40.416775,
        "longitude": -3.703790,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING"]
    }
    
    url = f"{BASE_URL}/api/v1/accommodation"
    response = requests.post(url, json=accommodation_payload, headers=headers)
    check_response(response, "Creación de Alojamiento", expected_status=201)
    
    accommodation_id = response.json().get("id")
    print(f"[i] Alojamiento creado con ID: {accommodation_id}")

def step_8_get_accommodation_details():
    """8. Obtiene los detalles de un alojamiento por su ID"""
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    url = f"{BASE_URL}/api/v1/accommodation/{accommodation_id}"
    response = requests.get(url, headers=headers)
    check_response(response, "Obtener Detalles del Alojamiento", expected_status=200)

def step_9_get_accommodations_catalog():
    """9. Obtiene el catálogo de alojamientos con filtros"""
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    params = {
        "ownerId": user_id,
        "visibility": "AVAILABLE",
        "page": 0,
        "size": 10
    }
    
    url = f"{BASE_URL}/api/v1/accommodation"
    response = requests.get(url, headers=headers, params=params)
    check_response(response, "Obtener Catálogo de Alojamientos", expected_status=200)

def step_10_update_accommodation():
    """10. Actualiza un alojamiento existente"""
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    update_payload = {
        "address": "Calle Gran Via 12, Modificado",
        "totalRooms": 5,
        "totalBathrooms": 3,
        "freeRooms": 3,
        "squareMeters": 150,
        "city": "Madrid",
        "country": "Spain",
        "province": "Madrid",
        "latitude": 40.416775,
        "longitude": -3.703790,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "BALCONY"]
    }
    
    url = f"{BASE_URL}/api/v1/accommodation/{accommodation_id}"
    response = requests.put(url, json=update_payload, headers=headers)
    check_response(response, "Actualizar Alojamiento", expected_status=200)

def step_11_upload_images():
    """11. Sube dos imágenes al alojamiento creado"""
    global image_id_1, image_id_2
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    url = f"{BASE_URL}/api/v1/accommodation/{accommodation_id}/images"
    
    # 1x1 pixel transparent PNG
    tiny_png = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06'
        b'\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf'
        b'\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    
    # Imagen 1
    files_1 = {
        'file': ('room_1.png', tiny_png, 'image/png')
    }
    response_1 = requests.post(url, headers=headers, files=files_1)
    check_response(response_1, "Subida de Imagen 1", expected_status=200)
    
    # Imagen 2
    files_2 = {
        'file': ('room_2.png', tiny_png, 'image/png')
    }
    response_2 = requests.post(url, headers=headers, files=files_2)
    check_response(response_2, "Subida de Imagen 2", expected_status=200)
    
    # Obtener IDs de las imágenes
    images = response_2.json().get("images", [])
    if len(images) >= 2:
        image_id_1 = images[0].get("id")
        image_id_2 = images[1].get("id")
        print(f"[i] Imagen 1 ID: {image_id_1} | Imagen 2 ID: {image_id_2}")
    else:
        print("[!] Advertencia: No se pudieron extraer los dos IDs de imagen.")

def step_12_reorder_images():
    """12. Cambia el orden de visualización de las imágenes del alojamiento"""
    if not image_id_1 or not image_id_2:
        print("[!] Omitiendo paso de reordenación por falta de IDs de imágenes.")
        return
        
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    order_payload = [
        {"imageId": image_id_1, "displayOrder": 2},
        {"imageId": image_id_2, "displayOrder": 1}
    ]
    
    url = f"{BASE_URL}/api/v1/accommodation/{accommodation_id}/images/order"
    response = requests.put(url, json=order_payload, headers=headers)
    check_response(response, "Reordenar Imágenes", expected_status=200)

def step_13_delete_image():
    """13. Elimina una imagen específica del alojamiento"""
    if not image_id_1:
        print("[!] Omitiendo paso de borrado de imagen por falta de ID.")
        return
        
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    url = f"{BASE_URL}/api/v1/accommodation/{accommodation_id}/images/{image_id_1}"
    response = requests.delete(url, headers=headers)
    check_response(response, "Eliminar Imagen del Alojamiento", expected_status=204)

def step_14_soft_delete_accommodation():
    """14. Realiza el soft delete del alojamiento"""
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    url = f"{BASE_URL}/api/v1/accommodation/delete/{accommodation_id}"
    response = requests.patch(url, headers=headers)
    check_response(response, "Soft Delete Alojamiento", expected_status=200)

# ──────────────────────────────────────────────────────────────────────────────
# 4. LISTING ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

def step_15_create_listing():
    """15. Crea un anuncio (Listing) asociado al alojamiento creado"""
    global listing_id
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    listing_payload = {
        "accommodationId": accommodation_id,
        "title": "Habitación en el centro de Madrid",
        "description": "Preciosa habitación con baño compartido.",
        "pricePerMonth": 450.00
    }
    
    url = f"{BASE_URL}/api/v1/listings"
    response = requests.post(url, json=listing_payload, headers=headers)
    check_response(response, "Creación de Anuncio (Listing)", expected_status=200)
    
    listing_id = response.json().get("id")
    print(f"[i] Anuncio creado con ID: {listing_id}")

def step_16_get_listing_details():
    """16. Obtiene los detalles de un anuncio específico"""
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    url = f"{BASE_URL}/api/v1/listings/{listing_id}"
    response = requests.get(url, headers=headers)
    check_response(response, "Obtener Detalles del Anuncio", expected_status=200)

def step_17_update_listing():
    """17. Actualiza la información de un anuncio"""
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    update_payload = {
        "title": "Habitación de lujo en Gran Vía",
        "description": "Habitación espaciosa con terraza y baño privado.",
        "pricePerMonth": 600.00
    }
    
    url = f"{BASE_URL}/api/v1/listings/{listing_id}"
    response = requests.put(url, json=update_payload, headers=headers)
    check_response(response, "Actualizar Anuncio (Listing)", expected_status=200)

def step_18_search_listings():
    """18. Realiza una búsqueda/filtro de los anuncios"""
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    url = f"{BASE_URL}/api/v1/listings"
    params = {
        "city": "Madrid",
        "page": 0,
        "size": 10
    }
    
    response = requests.get(url, headers=headers, params=params)
    check_response(response, "Búsqueda y Filtros de Anuncios", expected_status=200)

# ──────────────────────────────────────────────────────────────────────────────
# 5. ADMIN OPERATIONS
# ──────────────────────────────────────────────────────────────────────────────

def step_19_admin_login():
    """19. Simula el inicio de sesión como Administrador"""
    global admin_token
    login_payload = {
        "email": CORREO_ADMIN,
        "password": PASS_ADMIN
    }
    
    url = f"{BASE_URL}/api/v1/auth/login"
    response = requests.post(url, json=login_payload)
    
    if response.status_code != 200:
        print("\n[!] ERROR al autenticar Administrador.")
        print("Asegúrate de haber configurado 'CORREO_ADMIN' y 'PASS_ADMIN' al inicio del script.")
        print(f"Detalle de error del backend: {response.text}")
        sys.exit(1)
        
    check_response(response, "Login de Administrador", expected_status=200)
    admin_token = response.json().get("accessToken")
    print("[i] Token de Administrador obtenido.")

def step_20_admin_promote_user():
    """20. Admin promueve al usuario de prueba a Admin"""
    headers = {
        "Authorization": f"Bearer {admin_token}"
    }
    
    url = f"{BASE_URL}/api/v1/users/{user_id}/admin"
    response = requests.patch(url, headers=headers)
    check_response(response, "Admin: Promover Usuario a Admin", expected_status=204)

def step_21_admin_ban_unban_user():
    """21. Admin bloquea y desbloquea al usuario de prueba"""
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    # Banear usuario
    ban_payload = {
        "message": "Incumplimiento de términos de la comunidad",
        "bannedUntil": "2026-12-31T23:59:59"
    }
    url_ban = f"{BASE_URL}/api/v1/users/{user_id}/ban"
    response_ban = requests.patch(url_ban, json=ban_payload, headers=headers)
    check_response(response_ban, "Admin: Banear Usuario", expected_status=204)
    
    # Desbanear usuario
    url_unban = f"{BASE_URL}/api/v1/users/{user_id}/unban"
    response_unban = requests.patch(url_unban, headers=headers)
    check_response(response_unban, "Admin: Desbanear Usuario", expected_status=204)

def step_22_admin_ban_unban_flow():
    """22. Ejecuta operaciones administrativas de ban/unban y soft-delete de anuncios"""
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    # Banear Anuncio
    url_ban = f"{BASE_URL}/api/v1/listings/ban/{listing_id}"
    response_ban = requests.patch(url_ban, headers=headers)
    check_response(response_ban, "Admin: Banear Anuncio", expected_status=204)
    
    # Desbanear Anuncio
    url_unban = f"{BASE_URL}/api/v1/listings/unban/{listing_id}"
    response_unban = requests.patch(url_unban, headers=headers)
    check_response(response_unban, "Admin: Desbanear Anuncio", expected_status=204)
    
    # Soft Delete del anuncio
    headers_user = {
        "Authorization": f"Bearer {user_token}"
    }
    url_soft_delete = f"{BASE_URL}/api/v1/listings/softDelete/{listing_id}"
    response_soft = requests.patch(url_soft_delete, headers=headers_user)
    check_response(response_soft, "Usuario: Soft Delete Anuncio", expected_status=204)
    
    # Recuperar Anuncio (Admin)
    url_recover = f"{BASE_URL}/api/v1/listings/recover/{listing_id}"
    response_recover = requests.patch(url_recover, headers=headers)
    check_response(response_recover, "Admin: Recuperar Anuncio", expected_status=200)

# ──────────────────────────────────────────────────────────────────────────────
# 6. SOFT DELETE & REACTIVATION FLOW
# ──────────────────────────────────────────────────────────────────────────────

def step_23_soft_delete_and_reactivate_user(email, password):
    """23. Usuario realiza soft-delete de su cuenta y luego la reactiva vía email/Mailpit"""
    global user_token, user_refresh_token
    headers = {
        "Authorization": f"Bearer {user_token}"
    }
    
    # 1. Soft delete del usuario
    url_soft = f"{BASE_URL}/api/v1/users/me/delete/soft"
    response_soft = requests.patch(url_soft, headers=headers)
    check_response(response_soft, "Usuario: Soft-delete de cuenta", expected_status=204)
    
    # 2. Solicitar reactivación
    reactivate_req_payload = {
        "email": email
    }
    url_req = f"{BASE_URL}/api/v1/auth/reactivation-request"
    response_req = requests.post(url_req, json=reactivate_req_payload)
    check_response(response_req, "Solicitar Reactivación de Cuenta (Paso 1)", expected_status=200)
    
    # 3. Extraer token de Mailpit
    token = get_reactivation_token_from_mailpit(email)
    if not token:
        print("[-] ERROR: No se pudo obtener el token de reactivación de Mailpit. Abortando reactivación.")
        sys.exit(1)
        
    # 4. Reactivar cuenta
    reactivate_payload = {
        "token": token
    }
    url_reactivate = f"{BASE_URL}/api/v1/auth/reactivate"
    response_reactivate = requests.post(url_reactivate, json=reactivate_payload)
    check_response(response_reactivate, "Confirmar Reactivación de Cuenta (Paso 2)", expected_status=200)
    
    # Guardar los nuevos tokens de acceso tras la reactivación
    user_token = response_reactivate.json().get("accessToken")
    user_refresh_token = response_reactivate.json().get("refreshToken")
    print(f"[i] Cuenta reactivada y nueva sesión establecida.")

# ──────────────────────────────────────────────────────────────────────────────
# 7. HARD CLEANUP
# ──────────────────────────────────────────────────────────────────────────────

def step_24_hard_cleanup():
    """24. Ejecuta la limpieza absoluta eliminando Listing, Accommodation y User de prueba"""
    headers = {
        "Authorization": f"Bearer {admin_token}"
    }
    
    print("\n--- INICIANDO LIMPIEZA HARD (HARD CLEANUP) ---")
    
    # 1. Hard Delete Listing
    if listing_id:
        url_listing = f"{BASE_URL}/api/v1/listings/hardDelete/{listing_id}"
        response = requests.delete(url_listing, headers=headers)
        check_response(response, "Admin: Hard Delete Anuncio (Listing)", expected_status=204)
        
    # 2. Hard Delete Accommodation
    if accommodation_id:
        url_acc = f"{BASE_URL}/api/v1/accommodation/hardDelete/{accommodation_id}"
        response = requests.delete(url_acc, headers=headers)
        check_response(response, "Admin: Hard Delete Alojamiento (Accommodation)", expected_status=204)
        
    # 3. Hard Delete User
    if user_id:
        url_user = f"{BASE_URL}/api/v1/users/hard/{user_id}"
        response = requests.delete(url_user, headers=headers)
        check_response(response, "Admin: Hard Delete Usuario de Pruebas", expected_status=204)
        
    print("\n[+] Limpieza completada con éxito. Base de datos libre de residuos del test.")

# ==============================================================================
# FLUJO DE EJECUCIÓN PRINCIPAL
# ==============================================================================

if __name__ == "__main__":
    print("======================================================================")
    print("             SUITE DE PRUEBAS E2E AUTOMATIZADA: COLIVI                ")
    print("======================================================================")
    
    setup_admin()
    
    # 1. Autenticación Inicial
    current_email, current_password = step_1_register_user()
    step_2_login_user(current_email, current_password)
    step_3_refresh_token()
    
    # 2. Perfil de Usuario y Cambio de Credenciales
    step_4_update_profile()
    # Puesto que actualizar el perfil incrementa tokenVersion (JPA @Version), el token actual queda obsoleto.
    # Volvemos a loguearnos para adquirir un nuevo token con la versión de token correcta (version 2)
    step_2_login_user(current_email, current_password)
    
    current_email, current_password = step_5_update_credentials_and_relogin(current_email)
    step_6_user_logout_and_relogin(current_email, current_password)
    
    # 3. Gestión de Alojamientos e Imágenes
    step_7_create_accommodation()
    step_8_get_accommodation_details()
    step_9_get_accommodations_catalog()
    step_10_update_accommodation()
    step_11_upload_images()
    step_12_reorder_images()
    step_13_delete_image()
    
    # 4. Gestión de Anuncios
    step_15_create_listing()
    step_16_get_listing_details()
    step_17_update_listing()
    step_18_search_listings()
    
    step_14_soft_delete_accommodation() # Soft delete al alojamiento actual
    # 5. Autenticación del Administrador y Acciones Admin
    step_19_admin_login()
    step_20_admin_promote_user()
    # Promover a admin incrementa tokenVersion. Volvemos a iniciar sesión con el usuario de pruebas.
    step_2_login_user(current_email, current_password)
    
    step_21_admin_ban_unban_user()
    # Banear/Desbanear incrementa tokenVersion. Volvemos a iniciar sesión con el usuario de pruebas.
    step_2_login_user(current_email, current_password)
    
    step_22_admin_ban_unban_flow()
    
    # 6. Flujo de Reactivación de Cuenta
    step_23_soft_delete_and_reactivate_user(current_email, current_password)
    
    # 7. Limpieza de Datos
    step_24_hard_cleanup()
    
    print("\n======================================================================")
    print(" ¡ENHORABUENA! Todos los endpoints de la API han sido probados con éxito.")
    print("======================================================================")
