"""
Compatibility shim: keep `eccomerce.*` imports working by delegating
to the new `clinic` package. This allows existing references to
`eccomerce.settings` to continue functioning while we've introduced the
`clinic` package as the canonical project module.
"""

# Import all settings from the new clinic package.
from clinic.settings import *  # noqa: F401,F403