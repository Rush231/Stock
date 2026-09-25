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

## Rutas

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/me` (Bearer token)
- `GET /api/products` (Bearer token; acepta `?search=`)
- `POST /api/products` (Bearer token)
- `GET /api/branches` (Bearer token)
- `GET /api/movements` (Bearer token)

En el primer arranque se crea el usuario de desarrollo `admin@omnistock.local` con contraseña `admin123`. Define `OMNISTOCK_SECRET_KEY` y cambia esa contraseña antes de cualquier uso real.

La base SQLite se guarda en `backend/omnistock.sqlite3`; se puede cambiar con `OMNISTOCK_DATABASE`.
