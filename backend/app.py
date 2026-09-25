from flask import Flask, jsonify

from .config import MAX_REQUEST_BYTES
from .db import initialize_database
from .routes.api import api_blueprint


def create_app() -> Flask:
    application = Flask(__name__)
    application.config["MAX_CONTENT_LENGTH"] = MAX_REQUEST_BYTES
    initialize_database()
    application.register_blueprint(api_blueprint)

    @application.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    @application.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "recurso no encontrado"}), 404

    @application.errorhandler(500)
    def internal_error(_error):
        return jsonify({"error": "error interno del servidor"}), 500

    return application


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
