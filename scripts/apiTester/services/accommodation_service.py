from typing import Dict, Any, List
import requests
from core.client import ApiClient

class AccommodationService:
    def __init__(self, client: ApiClient):
        self.client = client
        self.base_path = "/api/v1/accommodation"
        
    def create(self, payload: Dict[str, Any], token: str) -> Dict[str, Any]:
        response = self.client.request("POST", self.base_path, "Creación de Alojamiento", expected_status=201, token=token, json=payload)
        return response.json()
        
    def get_details(self, accommodation_id: str, token: str) -> Dict[str, Any]:
        response = self.client.request("GET", f"{self.base_path}/{accommodation_id}", "Obtener Detalles del Alojamiento", expected_status=200, token=token)
        return response.json()
        
    def get_catalog(self, owner_id: str, token: str) -> Dict[str, Any]:
        params = {
            "ownerId": owner_id,
            "visibility": "AVAILABLE",
            "page": 0,
            "size": 10
        }
        response = self.client.request("GET", self.base_path, "Obtener Catálogo de Alojamientos", expected_status=200, token=token, params=params)
        return response.json()
        
    def update(self, accommodation_id: str, payload: Dict[str, Any], token: str) -> Dict[str, Any]:
        response = self.client.request("PUT", f"{self.base_path}/{accommodation_id}", "Actualizar Alojamiento", expected_status=200, token=token, json=payload)
        return response.json()
        
    def upload_image(self, accommodation_id: str, file_name: str, file_bytes: bytes, step_name: str, token: str) -> Dict[str, Any]:
        url = self.client._build_url(f"{self.base_path}/{accommodation_id}/images")
        files = {
            "file": (file_name, file_bytes, "image/png")
        }
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"\n--- PASO: {step_name} ---")
        try:
            response = requests.post(url, files=files, headers=headers)
        except requests.RequestException as e:
            print(f"[-] ERROR: Petición fallida ({step_name}): {e}")
            import sys
            sys.exit(1)
            
        self.client.check_response(response, 200)
        return response.json()
        
    def reorder_images(self, accommodation_id: str, payload: List[Dict[str, Any]], token: str) -> Dict[str, Any]:
        response = self.client.request("PUT", f"{self.base_path}/{accommodation_id}/images/order", "Reordenar Imágenes", expected_status=200, token=token, json=payload)
        return response.json()
        
    def delete_image(self, accommodation_id: str, image_id: str, token: str) -> None:
        self.client.request("DELETE", f"{self.base_path}/{accommodation_id}/images/{image_id}", "Eliminar Imagen del Alojamiento", expected_status=204, token=token)
        
    def soft_delete(self, accommodation_id: str, token: str) -> Dict[str, Any]:
        response = self.client.request("PATCH", f"{self.base_path}/delete/{accommodation_id}", "Soft Delete Alojamiento", expected_status=200, token=token)
        return response.json()
        
    def hard_delete(self, accommodation_id: str, admin_token: str) -> None:
        self.client.request("DELETE", f"{self.base_path}/hardDelete/{accommodation_id}", "Admin: Hard Delete Alojamiento (Accommodation)", expected_status=204, token=admin_token)
