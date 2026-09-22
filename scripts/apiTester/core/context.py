class TestContext:
    """Holds the shared state during the E2E test execution."""
    def __init__(self):
        # Current User State
        self.user_token: str = None
        self.user_refresh_token: str = None
        self.user_id: str = None
        self.current_email: str = None
        self.current_password: str = None
        
        # Admin State
        self.admin_token: str = None
        
        # Domain Entity IDs
        self.accommodation_id: str = None
        self.listing_id: str = None
        self.image_id_1: str = None
        self.image_id_2: str = None
        
    def clear(self):
        self.__init__()
