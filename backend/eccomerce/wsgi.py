"""
Compatibility wrapper for WSGI: ensures the settings module points to
`clinic.settings` so older references to `eccomerce.wsgi` continue to work.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eccomerce.settings')

application = get_wsgi_application()
