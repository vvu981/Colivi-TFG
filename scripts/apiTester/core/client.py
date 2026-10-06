import sys
import json
import requests
from typing import Dict, Any, Optional
from .exceptions import ApiException, AssertionException

class ApiClient:
    """A thin wrapper around requests that handles common headers and error checking."""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        
    def _build_url(self, endpoint: str) -> str:
        return f"{self.base_url}{endpoint}"

    def request(
        self, 
        method: str, 
        endpoint: str, 
        step_name: str, 
        expected_status: int = 200, 
        token: Optional[str] = None, 
        **kwargs
    ) -> requests.Response:
        """
        Executes an HTTP request and checks if the response status code matches expected_status.
        """
        url = self._build_url(endpoint)
        
        headers = kwargs.get("headers", {})
        if token:
            headers["Authorization"] = f"Bearer {token}"
        kwargs["headers"] = headers

        print(f"\n--- PASO: {step_name} ---")
        try:
            response = requests.request(method, url, **kwargs)
        except requests.RequestException as e:
            print(f"[-] ERROR: Petición fallida ({step_name}): {e}")
            sys.exit(1)

        self.check_response(response, expected_status)
        return response

    def check_response(self, response: requests.Response, expected_status: int):
        print(f"URL: {response.request.method} {response.request.url}")
        print(f"Código de estado esperado: {expected_status} | Recibido: {response.status_code}")
        
        if response.status_code == expected_status:
            print("[+] Éxito!")
            try:
                if response.text:
                    resp_json = response.json()
                    print("Respuesta JSON:")
                    print(json.dumps(resp_json, indent=2))
            except ValueError:
                pass # Not JSON or empty
            print("")
        else:
            print(f"[-] ERROR: Respuesta inesperada del backend ({response.status_code})")
            print(f"Detalle de la respuesta: {response.text}")
            sys.exit(1)
