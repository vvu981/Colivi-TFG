class ApiException(Exception):
    """Base exception for API requests."""
    pass

class AssertionException(Exception):
    """Exception raised when an API response does not meet expectations."""
    pass
