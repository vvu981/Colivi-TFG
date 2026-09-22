from core.context import TestContext
from core.config import Config
from services.auth_service import AuthService
from services.user_service import UserService
from services.listing_service import ListingService
from services.accommodation_service import AccommodationService
from services.mail_service import MailService

class AdminTests:
    def __init__(self, context: TestContext, auth_service: AuthService, user_service: UserService, 
                 listing_service: ListingService, accommodation_service: AccommodationService, mail_service: MailService):
        self.context = context
        self.auth_service = auth_service
        self.user_service = user_service
        self.listing_service = listing_service
        self.accommodation_service = accommodation_service
        self.mail_service = mail_service
        
    def test_admin_login(self):
        payload = {
            "email": Config.CORREO_ADMIN,
            "password": Config.PASS_ADMIN
        }
        resp = self.auth_service.login(payload)
        self.context.admin_token = resp.get("accessToken")
        
    def test_promote_user(self):
        self.user_service.promote_to_admin(self.context.user_id, self.context.admin_token)
        
    def test_ban_unban_user(self):
        ban_payload = {
            "message": "Incumplimiento de términos de la comunidad",
            "bannedUntil": "2026-12-31T23:59:59"
        }
        self.user_service.ban_user(self.context.user_id, ban_payload, self.context.admin_token)
        self.user_service.unban_user(self.context.user_id, self.context.admin_token)
        
    def test_ban_unban_listing(self):
        self.listing_service.ban(self.context.listing_id, self.context.admin_token)
        self.listing_service.unban(self.context.listing_id, self.context.admin_token)
        
    def test_user_soft_delete_listing(self):
        self.listing_service.soft_delete(self.context.listing_id, self.context.user_token)
        
    def test_recover_listing(self):
        self.listing_service.recover(self.context.listing_id, self.context.admin_token)
        
    def test_reactivation_flow(self):
        # Request reactivation
        payload_request = {"email": self.context.current_email}
        self.auth_service.request_reactivation(payload_request)
        
        # Get token from mailpit
        reactivation_token = self.mail_service.get_reactivation_token(self.context.current_email)
        
        # Confirm reactivation
        payload_reactivate = {
            "token": reactivation_token,
            "newPassword": self.context.current_password
        }
        resp = self.auth_service.reactivate(payload_reactivate)
        self.context.user_token = resp.get("accessToken")
        self.context.user_refresh_token = resp.get("refreshToken")
        
    def test_hard_cleanup(self):
        print("\n--- INICIANDO LIMPIEZA HARD (HARD CLEANUP) ---")
        if self.context.listing_id:
            self.listing_service.hard_delete(self.context.listing_id, self.context.admin_token)
        if self.context.accommodation_id:
            self.accommodation_service.hard_delete(self.context.accommodation_id, self.context.admin_token)
        if self.context.user_id:
            self.user_service.hard_delete(self.context.user_id, self.context.admin_token)
        print("\n[+] Limpieza completada con éxito. Base de datos libre de residuos del test.")
