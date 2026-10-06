import time
import requests
import re
import sys

class MailService:
    def __init__(self, mailpit_url: str):
        self.mailpit_url = mailpit_url
        
    def get_reactivation_token(self, email: str, max_retries: int = 10, delay: int = 3) -> str:
        print(f"[i] Buscando el email de reactivación para '{email}' en Mailpit...")
        for _ in range(max_retries):
            try:
                response = requests.get(f"{self.mailpit_url}/api/v1/messages")
                if response.status_code == 200:
                    data = response.json()
                    messages = data.get("messages", [])
                    for msg in messages:
                        if msg.get("To", [{}])[0].get("Address") == email:
                            # Verify if it's the reactivation email
                            if "Reactiva" in msg.get("Subject", ""):
                                msg_id = msg.get("ID")
                                return self._extract_token_from_message(msg_id)
            except Exception as e:
                print(f"[-] Error al conectar con Mailpit: {e}")
            
            time.sleep(delay)
            
        print("[-] ERROR: No se encontró el email de reactivación en Mailpit.")
        sys.exit(1)
        
    def _extract_token_from_message(self, msg_id: str) -> str:
        try:
            msg_resp = requests.get(f"{self.mailpit_url}/api/v1/message/{msg_id}")
            if msg_resp.status_code == 200:
                body = msg_resp.json().get("Text", "")
                match = re.search(r'Token de reactivación:\s*([A-Za-z0-9\-]+)', body)
                if match:
                    token = match.group(1)
                    print(f"[+] Token de reactivación encontrado en el email: {token}")
                    return token
        except Exception as e:
            pass
            
        print("[-] ERROR: No se pudo extraer el token del cuerpo del correo.")
        sys.exit(1)
