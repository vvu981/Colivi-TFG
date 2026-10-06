from core.context import TestContext
from core.utils import get_random_string, extract_id_from_jwt
from services.auth_service import AuthService
from core.config import Config
import subprocess

class AuthTests:
    def __init__(self, context: TestContext, auth_service: AuthService):
        self.context = context
        self.auth_service = auth_service
        
    def setup_admin(self):
        print("\n--- PASO 0: Setup Admin User ---")
        payload = {
            "nickname": "admin_test",
            "firstName": "Admin",
            "lastName1": "Test",
            "lastName2": "",
            "phone": "+34111111111",
            "email": Config.CORREO_ADMIN,
            "password": Config.PASS_ADMIN,
            "dateOfBirth": "1990-01-01",
            "gender": "OTHER"
        }
        try:
            # We bypass the client check_response here since we expect it might fail if already exists
            import requests
            requests.post(f"{Config.BASE_URL}/api/v1/auth/register", json=payload)
        except Exception:
            pass
            
        try:
            cmd = ["docker", "exec", "tfg_postgres", "psql", "-U", "tfg_user", "-d", "tfg_db", "-c", f'UPDATE "user" SET role = \'ADMIN\' WHERE email = \'{Config.CORREO_ADMIN}\';']
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("[+] Admin user setup correctly via DB")
        except Exception as e:
            print(f"[-] Could not promote admin via DB: {e}")

    def test_register_user(self):
        random_suffix = get_random_string(8)
        self.context.current_email = f"new_test_{random_suffix}@example.com"
        self.context.current_password = "Password123!"
        
        payload = {
            "nickname": f"new_{random_suffix}",
            "firstName": "Test",
            "lastName1": "User",
            "lastName2": "E2E",
            "phone": "+34600000000",
            "email": self.context.current_email,
            "password": self.context.current_password,
            "dateOfBirth": "1995-05-15",
            "gender": "MALE"
        }
        
        resp = self.auth_service.register(payload)
        self.context.user_token = resp.get("accessToken")
        self.context.user_refresh_token = resp.get("refreshToken")
        self.context.user_id = extract_id_from_jwt(self.context.user_token)

    def test_login_user(self):
        payload = {
            "email": self.context.current_email,
            "password": self.context.current_password
        }
        resp = self.auth_service.login(payload)
        self.context.user_token = resp.get("accessToken")
        self.context.user_refresh_token = resp.get("refreshToken")
        
    def test_refresh_token(self):
        payload = {
            "refreshToken": self.context.user_refresh_token
        }
        resp = self.auth_service.refresh_token(payload)
        self.context.user_token = resp.get("accessToken")
        self.context.user_refresh_token = resp.get("refreshToken")
