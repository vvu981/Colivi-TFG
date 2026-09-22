from typing import Dict, Any, Optional
from core.client import ApiClient

class UserService:
    def __init__(self, client: ApiClient):
        self.client = client
        self.base_path = "/api/v1/users"
        
    def update_profile(self, payload: Dict[str, Any], token: str) -> Dict[str, Any]:
        response = self.client.request("PATCH", f"{self.base_path}/me/profile", "Actualizar Perfil (Datos No Sensibles)", expected_status=200, token=token, json=payload)
        return response.json()
        
    def update_credentials(self, payload: Dict[str, Any], token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/me/credentials", "Actualizar Credenciales (Email/Password)", expected_status=204, token=token, json=payload)
        
    def soft_delete_me(self, token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/me/delete/soft", "Usuario: Soft-delete de cuenta", expected_status=204, token=token)
        
    def hard_delete(self, user_id: str, admin_token: str) -> None:
        self.client.request("DELETE", f"{self.base_path}/hard/{user_id}", "Admin: Hard Delete Usuario de Pruebas", expected_status=204, token=admin_token)
        
    def promote_to_admin(self, user_id: str, admin_token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/{user_id}/admin", "Admin: Promover Usuario a Admin", expected_status=204, token=admin_token)
        
    def ban_user(self, user_id: str, payload: Dict[str, Any], admin_token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/{user_id}/ban", "Admin: Banear Usuario", expected_status=204, token=admin_token, json=payload)
        
    def unban_user(self, user_id: str, admin_token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/{user_id}/unban", "Admin: Desbanear Usuario", expected_status=204, token=admin_token)
