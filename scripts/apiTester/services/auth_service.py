from typing import Dict, Any
from core.client import ApiClient

class AuthService:
    def __init__(self, client: ApiClient):
        self.client = client
        self.base_path = "/api/v1/auth"
        
    def register(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.request("POST", f"{self.base_path}/register", "Registro de Usuario", expected_status=200, json=payload)
        return response.json()
        
    def login(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.request("POST", f"{self.base_path}/login", "Login de Usuario", expected_status=200, json=payload)
        return response.json()
        
    def refresh_token(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.request("POST", f"{self.base_path}/refresh", "Refresh Token", expected_status=200, json=payload)
        return response.json()
        
    def request_reactivation(self, payload: Dict[str, Any]) -> None:
        self.client.request("POST", f"{self.base_path}/reactivation-request", "Solicitar Reactivación de Cuenta (Paso 1)", expected_status=200, json=payload)
        
    def reactivate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.request("POST", f"{self.base_path}/reactivate", "Confirmar Reactivación de Cuenta (Paso 2)", expected_status=200, json=payload)
        return response.json()
