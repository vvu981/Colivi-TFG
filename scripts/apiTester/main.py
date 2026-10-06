import sys
from core.config import Config
from core.client import ApiClient
from core.context import TestContext

from services.auth_service import AuthService
from services.user_service import UserService
from services.accommodation_service import AccommodationService
from services.listing_service import ListingService
from services.mail_service import MailService

from tests.test_auth import AuthTests
from tests.test_users import UserTests
from tests.test_accommodations import AccommodationTests
from tests.test_listings import ListingTests
from tests.test_admin import AdminTests

def run_tests():
    print("======================================================================")
    print("             SUITE DE PRUEBAS E2E AUTOMATIZADA: COLIVI (SOLID)        ")
    print("======================================================================")

    client = ApiClient(Config.BASE_URL)
    context = TestContext()
    
    auth_service = AuthService(client)
    user_service = UserService(client)
    accommodation_service = AccommodationService(client)
    listing_service = ListingService(client)
    mail_service = MailService(Config.MAILPIT_URL)
    
    auth_tests = AuthTests(context, auth_service)
    user_tests = UserTests(context, user_service)
    accommodation_tests = AccommodationTests(context, accommodation_service)
    listing_tests = ListingTests(context, listing_service)
    admin_tests = AdminTests(context, auth_service, user_service, listing_service, accommodation_service, mail_service)
    
    # 0. Setup Admin
    auth_tests.setup_admin()
    
    # 1. Autenticación Inicial
    auth_tests.test_register_user()
    auth_tests.test_login_user()
    auth_tests.test_refresh_token()
    
    # 2. Perfil de Usuario y Cambio de Credenciales
    user_tests.test_update_profile()
    auth_tests.test_login_user()  # tokenVersion updated
    
    user_tests.test_update_credentials()
    auth_tests.test_login_user()  # tokenVersion updated
    
    # 3. Gestión de Alojamientos e Imágenes
    accommodation_tests.test_create_accommodation()
    accommodation_tests.test_get_details()
    accommodation_tests.test_get_catalog()
    accommodation_tests.test_update_accommodation()
    accommodation_tests.test_upload_images()
    accommodation_tests.test_reorder_images()
    accommodation_tests.test_delete_image()
    
    # 4. Gestión de Anuncios
    listing_tests.test_create_listing()
    listing_tests.test_get_details()
    listing_tests.test_update_listing()
    listing_tests.test_search_listings()
    
    # Soft delete accommodation AFTER listings
    accommodation_tests.test_soft_delete()
    
    # 5. Autenticación del Administrador y Acciones Admin
    admin_tests.test_admin_login()
    
    admin_tests.test_promote_user()
    auth_tests.test_login_user()  # relogin because user became ADMIN (tokenVersion incremented)
    
    admin_tests.test_ban_unban_user()
    auth_tests.test_login_user()  # relogin because ban/unban increments tokenVersion
    
    admin_tests.test_ban_unban_listing()
    admin_tests.test_user_soft_delete_listing()
    admin_tests.test_recover_listing()
    
    # 6. Flujo de Reactivación de Cuenta
    user_tests.test_soft_delete()
    admin_tests.test_reactivation_flow()
    
    # 7. Limpieza de Datos
    admin_tests.test_hard_cleanup()

    print("\n======================================================================")
    print(" ¡ENHORABUENA! Todos los endpoints de la API han sido probados con éxito.")
    print("======================================================================")


if __name__ == "__main__":
    run_tests()
