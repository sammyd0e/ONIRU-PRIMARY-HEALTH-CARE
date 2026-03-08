"""
Compatibility wrapper for ASGI: delegates to `clinic.asgi` behavior
by ensuring the settings module points to `clinic.settings`.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic.settings')

application = get_asgi_application()
