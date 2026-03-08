# Clinic (renamed from SoftBuy / eccomerce)

This repository started as an ecommerce project (SoftBuy/eccomerce) and
has been adapted to a clinical domain. The low-risk approach taken here
preserves app labels and Django migrations while providing clinical
aliases and UI labels.

Mapping applied (UI and URL aliases):

- orders -> appointments
- products -> services
- reviews -> feedback
- users -> patients (User model shown as Patient in Admin)

What changed in code (safe, non-destructive):

- Added `clinic/` project package and made `eccomerce/` a compatibility
  wrapper that imports from `clinic`.
- Updated `manage.py` to use `clinic.settings`.
- Added runtime `verbose_name` mappings in admin modules so Admin shows
  clinical terms (no model or migration changes).
- Added URL aliases in `clinic/urls.py` so both ecommerce and clinical
  prefixes work (e.g., `/orders/` and `/appointments/`). These aliases
  point to the existing app URLConfs; placeholder `urls.py` files were
  created for each app to avoid import errors.

Why this approach?

- Renaming Django apps and their `AppConfig.name` values is risky: it
  changes migration labels and requires database table renames or data
  copy/migration. To keep the project runnable and safe, we used
  non-destructive changes first.

Next steps (pick one or more):

1. Replace placeholders and wire real views/routers under the new
   clinical endpoints (e.g., register ViewSets under `appointments`).
2. Perform a full app rename (orders -> appointments, etc.) — see
   `RENAMING_PLAN.md` for a detailed plan and caveats.
3. Update frontend/client code to use the clinical endpoints.

How to run (local development):

```bash
cd /path/to/SoftBuy
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # if present
python3 manage.py migrate
python3 manage.py runserver
```

If you want me to proceed with wiring endpoints (registering viewsets
and updating URL names) or to prepare/apply the full rename, tell me and
I'll continue.
