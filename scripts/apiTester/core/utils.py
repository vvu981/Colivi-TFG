import string
import random
import base64
import json

def get_random_string(length: int = 8) -> str:
    """Generate a random lowercase string of a given length."""
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for _ in range(length))

def extract_id_from_jwt(token: str) -> str:
    """Helper to decode the JWT payload lightly and extract the user ID."""
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
