import hashlib
import hmac
import secrets
import sqlite3
from pathlib import Path
from typing import Any

from .config import ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_PATH


def get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def hash_password(password: str, salt: bytes | None = None) -> str:
    password_salt = salt or secrets.token_bytes(16)
    derived_key = hashlib.pbkdf2_hmac("sha256", password.encode(), password_salt, 210_000)
    return f"{password_salt.hex()}:{derived_key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, expected_hash = stored_hash.split(":", 1)
        actual_hash = hash_password(password, bytes.fromhex(salt_hex)).split(":", 1)[1]
        return hmac.compare_digest(actual_hash, expected_hash)
    except (ValueError, TypeError):
        return False


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def initialize_database() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'OPERATOR',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                sku TEXT NOT NULL UNIQUE,
                barcode TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL,
                unit TEXT NOT NULL,
                cost_price REAL NOT NULL CHECK (cost_price >= 0),
                sale_price REAL NOT NULL CHECK (sale_price >= 0),
                min_stock INTEGER NOT NULL CHECK (min_stock >= 0),
                target_stock INTEGER NOT NULL CHECK (target_stock >= 0),
                supplier_id TEXT NOT NULL,
                supplier_name TEXT NOT NULL,
                ecommerce_sync INTEGER NOT NULL DEFAULT 0,
                ecommerce_mappings TEXT NOT NULL DEFAULT '{}',
                stocks TEXT NOT NULL DEFAULT '[]',
                has_lot_tracking INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS branches (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                address TEXT NOT NULL,
                city TEXT NOT NULL,
                phone TEXT NOT NULL,
                manager TEXT NOT NULL,
                active_pos_count INTEGER NOT NULL DEFAULT 0,
                is_main_hub INTEGER NOT NULL DEFAULT 0,
                total_skus INTEGER NOT NULL DEFAULT 0,
                total_stock_units INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS stock_movements (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                product_id TEXT NOT NULL,
                product_name TEXT NOT NULL,
                sku TEXT NOT NULL,
                barcode TEXT NOT NULL,
                type TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                branch_name TEXT NOT NULL,
                performed_by TEXT NOT NULL,
                details TEXT NOT NULL DEFAULT '{}'
            );
            """
        )
        existing_user = connection.execute("SELECT 1 FROM users LIMIT 1").fetchone()
        if existing_user is None and ADMIN_EMAIL and ADMIN_PASSWORD:
            connection.execute(
                "INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                ("user-admin", ADMIN_EMAIL.lower(), "Administrador", hash_password(ADMIN_PASSWORD), "ADMIN"),
            )
