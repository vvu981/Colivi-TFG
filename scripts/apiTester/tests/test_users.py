from core.context import TestContext
from core.utils import get_random_string
from services.user_service import UserService

class UserTests:
    def __init__(self, context: TestContext, user_service: UserService):
        self.context = context
        self.user_service = user_service
        
    def test_update_profile(self):
        payload = {
            "nickname": f"upd_{get_random_string()}",
            "firstName": "UsuarioModificado",
            "lastName1": "TestMod",
            "lastName2": "E2E",
            "phone": "+34611111111",
            "dateOfBirth": "1995-05-15",
            "gender": "OTHER",
            "profilePicUrl": "https://example.com/pic.jpg"
        }
        self.user_service.update_profile(payload, self.context.user_token)
        
    def test_update_credentials(self):
        random_suffix = get_random_string(8)
        new_email = f"upd_{random_suffix}@example.com"
        new_password = "NewPassword123!"
        
        payload = {
            "currentPassword": self.context.current_password,
            "newEmail": new_email,
            "newPassword": new_password
        }
        self.user_service.update_credentials(payload, self.context.user_token)
        
        self.context.current_email = new_email
        self.context.current_password = new_password
        
    def test_soft_delete(self):
        self.user_service.soft_delete_me(self.context.user_token)
