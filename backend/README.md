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
En otra terminal, inicia el frontend con `bun run dev` y abre `http://127.0.0.1:3000`.

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
- `POST /api/auth/register`
- `POST /api/auth/2fa/verify`
- `POST /api/auth/logout`
- `GET /api/me` (Bearer token)
- `GET /api/products` (Bearer token; acepta `?search=`)
- `POST /api/products` (Bearer token)
- `GET /api/branches` (Bearer token)
- `GET /api/movements` (Bearer token)

En el primer arranque se crea un usuario administrador únicamente cuando `OMNISTOCK_ADMIN_EMAIL`, `OMNISTOCK_ADMIN_PASSWORD`, `OMNISTOCK_ADMIN_ORGANIZATION_ID` y `OMNISTOCK_ADMIN_TWO_FACTOR_SECRET` están definidas. No existen credenciales por defecto. Las rutas sensibles exigen 2FA verificado.

La base SQLite se guarda en `backend/omnistock.sqlite3`; se puede cambiar con `OMNISTOCK_DATABASE`.
