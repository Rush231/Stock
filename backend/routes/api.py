import json
import re
import base64
import sqlite3
import secrets
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from flask import Blueprint, g, jsonify, request

from ..auth import create_token, require_authentication, require_roles, require_two_factor, verify_totp
from ..config import ACCESS_COOKIE_NAME, COOKIE_SECURE, LOGIN_LOCKOUT_SECONDS, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS
from ..db import get_connection, hash_password, row_to_dict, verify_password

api_blueprint = Blueprint("api", __name__, url_prefix="/api")
login_attempts: dict[str, list[float]] = {}
login_attempts_lock = threading.Lock()


def _json_body() -> dict[str, Any] | None:
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else None


def _required_text(body: dict[str, Any], field_name: str, maximum_length: int = 255) -> str | None:
    field_value = body.get(field_name)
    if not isinstance(field_value, str):
        return None
    normalized_value = field_value.strip()
    return normalized_value if normalized_value and len(normalized_value) <= maximum_length else None


def _integer_field(body: dict[str, Any], field_name: str, minimum_value: int = 0) -> int | None:
    field_value = body.get(field_name)
    if isinstance(field_value, bool) or not isinstance(field_value, int) or field_value < minimum_value:
        return None
    return field_value


def _user_payload(user_row: sqlite3.Row, two_factor_verified: bool = False) -> dict[str, Any]:
    return {
        "id": user_row["id"],
        "email": user_row["email"],
        "name": user_row["name"],
        "organization_id": user_row["organization_id"],
        "organization_name": user_row["organization_name"],
        "role": user_row["role"],
        "two_factor_enabled": bool(user_row["two_factor_enabled"]),
        "two_factor_verified": two_factor_verified,
    }


def _session_response(user: dict[str, Any]) -> Any:
    response = jsonify({"user": {key: user[key] for key in ("id", "email", "name", "organization_id", "organization_name", "role", "two_factor_enabled")}})
    response.set_cookie(ACCESS_COOKIE_NAME, create_token(user), httponly=True, secure=COOKIE_SECURE, samesite="Strict", max_age=28800, path="/")
    return response


def _login_is_locked(client_key: str, current_time: float) -> bool:
    with login_attempts_lock:
        recent_attempts = [attempt for attempt in login_attempts.get(client_key, []) if current_time - attempt < LOGIN_LOCKOUT_SECONDS]
        login_attempts[client_key] = recent_attempts
        return len(recent_attempts) >= LOGIN_MAX_ATTEMPTS


def _record_login_failure(client_key: str, current_time: float) -> None:
    with login_attempts_lock:
        recent_attempts = [attempt for attempt in login_attempts.get(client_key, []) if current_time - attempt < LOGIN_WINDOW_SECONDS]
        recent_attempts.append(current_time)
        login_attempts[client_key] = recent_attempts


def _product_response(row: sqlite3.Row) -> dict[str, Any]:
    product = row_to_dict(row)
    product["ecommerceSync"] = bool(product.pop("ecommerce_sync"))
    product["ecommerceMappings"] = json.loads(product.pop("ecommerce_mappings"))
    product["stocks"] = json.loads(product["stocks"])
    product["hasLotTracking"] = bool(product.pop("has_lot_tracking"))
    product["costPrice"] = product.pop("cost_price")
    product["salePrice"] = product.pop("sale_price")
    product["minStock"] = product.pop("min_stock")
    product["targetStock"] = product.pop("target_stock")
    product["supplierId"] = product.pop("supplier_id")
    product["supplierName"] = product.pop("supplier_name")
    product["createdAt"] = product.pop("created_at")
    product["updatedAt"] = product.pop("updated_at")
    return product


@api_blueprint.get("/health")
def health() -> tuple[Any, int]:
    return jsonify({"status": "ok", "service": "omnistock-api"}), 200


@api_blueprint.post("/auth/login")
def login() -> tuple[Any, int]:
    client_key = request.remote_addr or "unknown"
    current_time = time.monotonic()
    if _login_is_locked(client_key, current_time):
        return jsonify({"error": "demasiados intentos; reintenta más tarde"}), 429
    body = _json_body()
    email = _required_text(body or {}, "email", 320) if body else None
    password = body.get("password") if body else None
    if email is None or not isinstance(password, str) or not 1 <= len(password) <= 200:
        return jsonify({"error": "email y password son obligatorios"}), 400
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "email inválido"}), 400
    with get_connection() as connection:
        user_row = connection.execute("SELECT id, email, name, organization_id, organization_name, role, password_hash, two_factor_enabled, two_factor_secret FROM users WHERE email = ?", (email.lower(),)).fetchone()
    if user_row is None or not verify_password(password, user_row["password_hash"]):
        _record_login_failure(client_key, current_time)
        return jsonify({"error": "credenciales inválidas"}), 401
    with login_attempts_lock:
        login_attempts.pop(client_key, None)
    totp_code = body.get("totpCode")
    if user_row["two_factor_enabled"] and (not isinstance(totp_code, str) or not verify_totp(totp_code, user_row["two_factor_secret"] or "")):
        _record_login_failure(client_key, current_time)
        return jsonify({"error": "se requiere un código 2FA válido", "twoFactorRequired": True}), 403
    user = _user_payload(user_row, two_factor_verified=bool(user_row["two_factor_enabled"]))
    return _session_response(user), 200


@api_blueprint.post("/auth/register")
def register() -> tuple[Any, int]:
    body = _json_body()
    if body is None:
        return jsonify({"error": "el cuerpo debe ser JSON"}), 400
    name = _required_text(body, "name", 120)
    email = _required_text(body, "email", 320)
    password = body.get("password")
    organization_name = _required_text(body, "organizationName", 160)
    if not name or not email or not organization_name or not isinstance(password, str) or len(password) < 12 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "nombre, organización, email válido y contraseña de al menos 12 caracteres son obligatorios"}), 400
    organization_id = f"org-{secrets.token_urlsafe(10).lower()}"
    user_id = f"user-{secrets.token_urlsafe(10).lower()}"
    try:
        with get_connection() as connection:
            connection.execute(
                "INSERT INTO users (id, email, name, organization_id, organization_name, password_hash, role, two_factor_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
                (user_id, email.lower(), name, organization_id, organization_name, hash_password(password), "ADMIN"),
            )
            user_row = connection.execute("SELECT id, email, name, organization_id, organization_name, role, two_factor_enabled FROM users WHERE id = ?", (user_id,)).fetchone()
    except sqlite3.IntegrityError:
        return jsonify({"error": "el email ya está registrado"}), 409
    return _session_response(_user_payload(user_row)), 201


@api_blueprint.post("/auth/logout")
def logout() -> tuple[Any, int]:
    response = jsonify({"status": "sesión cerrada"})
    response.delete_cookie(ACCESS_COOKIE_NAME, path="/")
    return response, 200


@api_blueprint.post("/auth/2fa/verify")
@require_authentication
def verify_two_factor() -> tuple[Any, int]:
    body = _json_body()
    totp_code = body.get("totpCode") if body else None
    if not isinstance(totp_code, str):
        return jsonify({"error": "totpCode es obligatorio"}), 400
    with get_connection() as connection:
        user_row = connection.execute("SELECT id, email, name, organization_id, organization_name, role, two_factor_enabled, two_factor_secret FROM users WHERE id = ? AND organization_id = ?", (g.authenticated_user["sub"], g.authenticated_user["org"])).fetchone()
    if user_row is None or not user_row["two_factor_enabled"] or not verify_totp(totp_code, user_row["two_factor_secret"] or ""):
        return jsonify({"error": "código 2FA inválido"}), 403
    user = _user_payload(user_row, two_factor_verified=True)
    response = jsonify({"status": "2FA verificado"})
    response.set_cookie(ACCESS_COOKIE_NAME, create_token(user), httponly=True, secure=COOKIE_SECURE, samesite="Strict", max_age=28800, path="/")
    return response, 200


@api_blueprint.post("/auth/2fa/setup")
@require_authentication
def setup_two_factor() -> tuple[Any, int]:
    secret = base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")
    with get_connection() as connection:
        connection.execute("UPDATE users SET two_factor_secret = ? WHERE id = ? AND organization_id = ?", (secret, g.authenticated_user["sub"], g.authenticated_user["org"]))
    return jsonify({"secret": secret}), 200


@api_blueprint.post("/auth/2fa/enable")
@require_authentication
def enable_two_factor() -> tuple[Any, int]:
    body = _json_body()
    totp_code = body.get("totpCode") if body else None
    with get_connection() as connection:
        user_row = connection.execute("SELECT id, email, name, organization_id, organization_name, role, two_factor_enabled, two_factor_secret FROM users WHERE id = ? AND organization_id = ?", (g.authenticated_user["sub"], g.authenticated_user["org"])).fetchone()
        if user_row is None or not isinstance(totp_code, str) or not verify_totp(totp_code, user_row["two_factor_secret"] or ""):
            return jsonify({"error": "código 2FA inválido"}), 403
        connection.execute("UPDATE users SET two_factor_enabled = 1 WHERE id = ? AND organization_id = ?", (g.authenticated_user["sub"], g.authenticated_user["org"]))
    user = _user_payload(user_row, two_factor_verified=True)
    user["two_factor_enabled"] = True
    response = jsonify({"status": "2FA activado"})
    response.set_cookie(ACCESS_COOKIE_NAME, create_token(user), httponly=True, secure=COOKIE_SECURE, samesite="Strict", max_age=28800, path="/")
    return response, 200


@api_blueprint.post("/auth/2fa/disable")
@require_authentication
@require_two_factor
def disable_two_factor() -> tuple[Any, int]:
    with get_connection() as connection:
        connection.execute("UPDATE users SET two_factor_enabled = 0 WHERE id = ? AND organization_id = ?", (g.authenticated_user["sub"], g.authenticated_user["org"]))
    response = jsonify({"status": "2FA desactivado"})
    response.delete_cookie(ACCESS_COOKIE_NAME, path="/")
    return response, 200


@api_blueprint.get("/me")
@require_authentication
def current_user() -> tuple[Any, int]:
    return jsonify({"user": {key: g.authenticated_user[key] for key in ("sub", "email", "name", "role", "org", "organization_name", "two_factor_enabled", "two_factor_verified")}}), 200


@api_blueprint.get("/products")
@require_authentication
@require_two_factor
def list_products() -> tuple[Any, int]:
    search_term = request.args.get("search", "").strip()
    with get_connection() as connection:
        if search_term:
            pattern = f"%{search_term}%"
            rows = connection.execute("SELECT * FROM products WHERE organization_id = ? AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?) ORDER BY name", (g.authenticated_user["org"], pattern, pattern, pattern)).fetchall()
        else:
            rows = connection.execute("SELECT * FROM products WHERE organization_id = ? ORDER BY name", (g.authenticated_user["org"],)).fetchall()
    return jsonify({"items": [_product_response(row) for row in rows]}), 200


@api_blueprint.post("/products")
@require_authentication
@require_two_factor
@require_roles("ADMIN", "SUPERVISOR")
def create_product() -> tuple[Any, int]:
    body = _json_body()
    if body is None:
        return jsonify({"error": "el cuerpo debe ser JSON"}), 400
    text_fields = {field: _required_text(body, field) for field in ("sku", "barcode", "name", "category", "unit", "supplierId", "supplierName")}
    numeric_fields = {field: _integer_field(body, field) for field in ("minStock", "targetStock")}
    decimal_fields = {field: body.get(field) for field in ("costPrice", "salePrice")}
    ecommerce_mappings = body.get("ecommerceMappings", {})
    stocks = body.get("stocks", [])
    if not isinstance(ecommerce_mappings, dict) or not isinstance(stocks, list) or len(stocks) > 500 or any(len(str(value)) > 10000 for value in (ecommerce_mappings, stocks)):
        return jsonify({"error": "estructura de inventario inválida"}), 400
    if any(value is None for value in text_fields.values()) or any(value is None for value in numeric_fields.values()) or any(isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0 for value in decimal_fields.values()):
        return jsonify({"error": "payload de producto inválido"}), 400
    now = datetime.now(timezone.utc).isoformat()
    product_id = f"prod-{uuid.uuid4().hex[:12]}"
    try:
        with get_connection() as connection:
            connection.execute(
                "INSERT INTO products (id, organization_id, sku, barcode, name, description, category, unit, cost_price, sale_price, min_stock, target_stock, supplier_id, supplier_name, ecommerce_sync, ecommerce_mappings, stocks, has_lot_tracking, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (product_id, g.authenticated_user["org"], text_fields["sku"], text_fields["barcode"], text_fields["name"], body.get("description", "") if isinstance(body.get("description", ""), str) else "", text_fields["category"], text_fields["unit"], decimal_fields["costPrice"], decimal_fields["salePrice"], numeric_fields["minStock"], numeric_fields["targetStock"], text_fields["supplierId"], text_fields["supplierName"], int(bool(body.get("ecommerceSync", False))), json.dumps(ecommerce_mappings), json.dumps(stocks), int(bool(body.get("hasLotTracking", False))), now, now),
            )
            created_product = connection.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    except sqlite3.IntegrityError:
        return jsonify({"error": "sku o barcode ya existente"}), 409
    return jsonify({"item": _product_response(created_product)}), 201


@api_blueprint.get("/branches")
@require_authentication
@require_two_factor
def list_branches() -> tuple[Any, int]:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM branches WHERE organization_id = ? ORDER BY name", (g.authenticated_user["org"],)).fetchall()
    return jsonify({"items": [row_to_dict(row) for row in rows]}), 200


@api_blueprint.get("/movements")
@require_authentication
@require_two_factor
def list_movements() -> tuple[Any, int]:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM stock_movements WHERE organization_id = ? ORDER BY timestamp DESC LIMIT 500", (g.authenticated_user["org"],)).fetchall()
    movements = []
    for row in rows:
        movement = row_to_dict(row)
        movement["details"] = json.loads(movement["details"])
        movements.append(movement)
    return jsonify({"items": movements}), 200
