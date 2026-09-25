import base64
import hashlib
import hmac
import json
import time
from functools import wraps
from typing import Any, Callable, TypeVar, cast

from flask import Request, g, jsonify, request

from .config import SECRET_KEY, TOKEN_TTL_SECONDS

RouteFunction = TypeVar("RouteFunction", bound=Callable[..., Any])


def create_token(user: dict[str, Any]) -> str:
    payload = {"sub": user["id"], "email": user["email"], "role": user["role"], "exp": int(time.time()) + TOKEN_TTL_SECONDS}
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
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return None


def _authorization_token(current_request: Request) -> str | None:
    authorization_header = current_request.headers.get("Authorization", "")
    scheme, _, token = authorization_header.partition(" ")
    return token if scheme.lower() == "bearer" and token else None


def require_authentication(route_function: RouteFunction) -> RouteFunction:
    @wraps(route_function)
    def authenticated_route(*args: Any, **kwargs: Any) -> Any:
        token = _authorization_token(request)
        authenticated_user = decode_token(token) if token else None
        if authenticated_user is None:
            return jsonify({"error": "Token ausente, inválido o expirado"}), 401
        g.authenticated_user = authenticated_user
        return route_function(*args, **kwargs)

    return cast(RouteFunction, authenticated_route)
