from typing import Dict, Any
from core.client import ApiClient

class ListingService:
    def __init__(self, client: ApiClient):
        self.client = client
        self.base_path = "/api/v1/listings"
        
    def create(self, payload: Dict[str, Any], token: str) -> Dict[str, Any]:
        response = self.client.request("POST", self.base_path, "Creación de Anuncio (Listing)", expected_status=200, token=token, json=payload)
        return response.json()
        
    def get_details(self, listing_id: str, token: str) -> Dict[str, Any]:
        response = self.client.request("GET", f"{self.base_path}/{listing_id}", "Obtener Detalles del Anuncio", expected_status=200, token=token)
        return response.json()
        
    def update(self, listing_id: str, payload: Dict[str, Any], token: str) -> Dict[str, Any]:
        response = self.client.request("PUT", f"{self.base_path}/{listing_id}", "Actualizar Anuncio (Listing)", expected_status=200, token=token, json=payload)
        return response.json()
        
    def search(self, token: str) -> Dict[str, Any]:
        params = {
            "city": "Madrid",
            "page": 0,
            "size": 10
        }
        response = self.client.request("GET", self.base_path, "Búsqueda y Filtros de Anuncios", expected_status=200, token=token, params=params)
        return response.json()
        
    def ban(self, listing_id: str, admin_token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/ban/{listing_id}", "Admin: Banear Anuncio", expected_status=204, token=admin_token)
        
    def unban(self, listing_id: str, admin_token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/unban/{listing_id}", "Admin: Desbanear Anuncio", expected_status=204, token=admin_token)
        
    def soft_delete(self, listing_id: str, token: str) -> None:
        self.client.request("PATCH", f"{self.base_path}/softDelete/{listing_id}", "Usuario: Soft Delete Anuncio", expected_status=204, token=token)
        
    def recover(self, listing_id: str, admin_token: str) -> Dict[str, Any]:
        response = self.client.request("PATCH", f"{self.base_path}/recover/{listing_id}", "Admin: Recuperar Anuncio", expected_status=200, token=admin_token)
        return response.json()
        
    def hard_delete(self, listing_id: str, admin_token: str) -> None:
        self.client.request("DELETE", f"{self.base_path}/hardDelete/{listing_id}", "Admin: Hard Delete Anuncio (Listing)", expected_status=204, token=admin_token)
