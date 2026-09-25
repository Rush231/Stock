import hashlib
import hmac
import json
import time
import base64
import binascii
from functools import wraps
from typing import Any, Callable, TypeVar, cast

from flask import Request, g, jsonify, request

from .config import ACCESS_COOKIE_NAME, SECRET_KEY, TOKEN_TTL_SECONDS

RouteFunction = TypeVar("RouteFunction", bound=Callable[..., Any])


def create_token(user: dict[str, Any]) -> str:
    payload = {"sub": user["id"], "email": user["email"], "name": user["name"], "role": user["role"], "org": user["organization_id"], "organization_name": user.get("organization_name", user["organization_id"]), "two_factor_enabled": bool(user.get("two_factor_enabled", False)), "two_factor_verified": bool(user.get("two_factor_verified", False)), "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(SECRET_KEY.encode(), encoded_payload.encode(), hashlib.sha256).hexdigest()
    return f"{encoded_payload}.{signature}"


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        encoded_payload, supplied_signature = token.split(".", 1)
        expected_signature = hmac.new(SECRET_KEY.encode(), encoded_payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(supplied_signature, expected_signature):
            return None
        padded_payload = encoded_payload + "=" * (-len(encoded_payload) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded_payload))
        if not isinstance(payload, dict) or int(payload["exp"]) < int(time.time()):
            return None
        return payload
    except (KeyError, ValueError, TypeError, binascii.Error, json.JSONDecodeError):
        return None


def _authorization_token(current_request: Request) -> str | None:
    authorization_header = current_request.headers.get("Authorization", "")
    scheme, _, token = authorization_header.partition(" ")
    return token if scheme.lower() == "bearer" and token else None


def require_authentication(route_function: RouteFunction) -> RouteFunction:
    @wraps(route_function)
    def authenticated_route(*args: Any, **kwargs: Any) -> Any:
        token = _authorization_token(request) or request.cookies.get(ACCESS_COOKIE_NAME)
        authenticated_user = decode_token(token) if token else None
        if authenticated_user is None:
            return jsonify({"error": "Token ausente, inválido o expirado"}), 401
        g.authenticated_user = authenticated_user
        return route_function(*args, **kwargs)

    return cast(RouteFunction, authenticated_route)


def require_roles(*allowed_roles: str) -> Callable[[RouteFunction], RouteFunction]:
    def role_decorator(route_function: RouteFunction) -> RouteFunction:
        @wraps(route_function)
        def authorized_route(*args: Any, **kwargs: Any) -> Any:
            if getattr(g, "authenticated_user", {}).get("role") not in allowed_roles:
                return jsonify({"error": "permisos insuficientes"}), 403
            return route_function(*args, **kwargs)

        return cast(RouteFunction, authorized_route)

    return role_decorator


def require_two_factor(route_function: RouteFunction) -> RouteFunction:
    @wraps(route_function)
    def two_factor_route(*args: Any, **kwargs: Any) -> Any:
        authenticated_user = getattr(g, "authenticated_user", {})
        if authenticated_user.get("two_factor_enabled", False) and not authenticated_user.get("two_factor_verified", False):
            return jsonify({"error": "se requiere verificación 2FA"}), 403
        return route_function(*args, **kwargs)

    return cast(RouteFunction, two_factor_route)


def generate_totp(secret: str, timestamp: int | None = None) -> str:
    normalized_secret = secret.replace(" ", "").upper()
    key = base64.b32decode(normalized_secret + "=" * (-len(normalized_secret) % 8), casefold=True)
    counter = int((timestamp or int(time.time())) // 30).to_bytes(8, "big")
    digest = hmac.new(key, counter, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = (int.from_bytes(digest[offset:offset + 4], "big") & 0x7FFFFFFF) % 1_000_000
    return f"{code:06d}"


def verify_totp(input_code: str, secret: str) -> bool:
    if not input_code.isdigit() or len(input_code) != 6:
        return False
    try:
        current_time = int(time.time())
        return any(hmac.compare_digest(generate_totp(secret, current_time + drift), input_code) for drift in (-30, 0, 30))
    except (ValueError, binascii.Error):
        return False
