from core.context import TestContext
from services.listing_service import ListingService

class ListingTests:
    def __init__(self, context: TestContext, listing_service: ListingService):
        self.context = context
        self.listing_service = listing_service
        
    def test_create_listing(self):
        payload = {
            "accommodationId": self.context.accommodation_id,
            "title": "Habitación en el centro de Madrid",
            "description": "Preciosa habitación con baño compartido.",
            "pricePerMonth": 450.00
        }
        resp = self.listing_service.create(payload, self.context.user_token)
        self.context.listing_id = resp.get("id")
        
    def test_get_details(self):
        self.listing_service.get_details(self.context.listing_id, self.context.user_token)
        
    def test_update_listing(self):
        payload = {
            "accommodationId": self.context.accommodation_id,
            "title": "Habitación de lujo en Gran Vía",
            "description": "Habitación espaciosa con terraza y baño privado.",
            "pricePerMonth": 600.00
        }
        self.listing_service.update(self.context.listing_id, payload, self.context.user_token)
        
    def test_search_listings(self):
        self.listing_service.search(self.context.user_token)
