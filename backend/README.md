# OmniStock API

Backend REST en Flask para la aplicación de inventario.

## Inicio

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m backend.app
```

La API queda disponible en `http://localhost:5000`.

Antes de iniciar, define un secreto y las credenciales iniciales fuera del código:

```bash
export OMNISTOCK_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
export OMNISTOCK_ADMIN_EMAIL="admin@tuempresa.com"
export OMNISTOCK_ADMIN_PASSWORD="cambia-esta-clave"
python -m backend.app
```

## Rutas

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/me` (Bearer token)
- `GET /api/products` (Bearer token; acepta `?search=`)
- `POST /api/products` (Bearer token)
- `GET /api/branches` (Bearer token)
- `GET /api/movements` (Bearer token)

En el primer arranque se crea un usuario administrador únicamente cuando `OMNISTOCK_ADMIN_EMAIL` y `OMNISTOCK_ADMIN_PASSWORD` están definidas. No existen credenciales por defecto.

La base SQLite se guarda en `backend/omnistock.sqlite3`; se puede cambiar con `OMNISTOCK_DATABASE`.
