from core.context import TestContext
from services.accommodation_service import AccommodationService
import base64

# A valid 1x1 transparent PNG file
TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)

class AccommodationTests:
    def __init__(self, context: TestContext, accommodation_service: AccommodationService):
        self.context = context
        self.accommodation_service = accommodation_service
        
    def test_create_accommodation(self):
        payload = {
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
            "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING"]
        }
        resp = self.accommodation_service.create(payload, self.context.user_token)
        self.context.accommodation_id = resp.get("id")
        
    def test_get_details(self):
        self.accommodation_service.get_details(self.context.accommodation_id, self.context.user_token)
        
    def test_get_catalog(self):
        self.accommodation_service.get_catalog(self.context.user_id, self.context.user_token)
        
    def test_update_accommodation(self):
        payload = {
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
            "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "BALCONY"]
        }
        self.accommodation_service.update(self.context.accommodation_id, payload, self.context.user_token)
        
    def test_upload_images(self):
        resp1 = self.accommodation_service.upload_image(
            self.context.accommodation_id, "mock1.png", TINY_PNG, "Subida de Imagen 1", self.context.user_token
        )
        images = resp1.get("images", [])
        if len(images) > 0:
            self.context.image_id_1 = images[0].get("id")
            
        resp2 = self.accommodation_service.upload_image(
            self.context.accommodation_id, "mock2.png", TINY_PNG, "Subida de Imagen 2", self.context.user_token
        )
        images = resp2.get("images", [])
        if len(images) > 1:
            self.context.image_id_2 = images[1].get("id")
            
    def test_reorder_images(self):
        if not self.context.image_id_1 or not self.context.image_id_2:
            return
        payload = [
            {"imageId": self.context.image_id_2, "displayOrder": 1},
            {"imageId": self.context.image_id_1, "displayOrder": 2}
        ]
        self.accommodation_service.reorder_images(self.context.accommodation_id, payload, self.context.user_token)
        
    def test_delete_image(self):
        if not self.context.image_id_1:
            return
        self.accommodation_service.delete_image(self.context.accommodation_id, self.context.image_id_1, self.context.user_token)
        
    def test_soft_delete(self):
        self.accommodation_service.soft_delete(self.context.accommodation_id, self.context.user_token)
