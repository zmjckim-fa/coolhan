"""
app-vuln — intentionally vulnerable sample (login + item lookup).
DO NOT DEPLOY. For Security Reviewer adversarial verification only.
"""
import hashlib
import sqlite3

from flask import Flask, request, jsonify

app = Flask(__name__)

# --- C1: hardcoded secrets in source ---
DB_PASSWORD = "P@ssw0rd-prod-2024"           # hardcoded DB password
API_KEY = "EXAMPLE_FAKE_API_KEY_redacted"    # hardcoded third-party API key (placeholder)
app.secret_key = "hardcoded-flask-secret"     # hardcoded session secret


def get_db():
    conn = sqlite3.connect(":memory:")
    return conn


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    # --- B1: SQL injection via string concatenation ---
    query = "SELECT id, password_hash FROM users WHERE username = '" + username + "'"
    cur = get_db().cursor()
    cur.execute(query)
    row = cur.fetchone()
    if not row:
        return jsonify({"error": "no user"}), 401

    user_id, stored = row

    # --- A2: weak auth — MD5, no salt; also plaintext fallback ---
    md5_attempt = hashlib.md5(password.encode()).hexdigest()
    if md5_attempt == stored or password == stored:  # plaintext compare fallback
        return jsonify({"token": user_id, "api_key": API_KEY})  # also leaks secret
    return jsonify({"error": "bad credentials"}), 401


@app.route("/item/<item_id>", methods=["GET"])
def get_item(item_id):
    # --- A1: broken access control / IDOR — no authz, no ownership check ---
    # Returns any item by id regardless of who is requesting.
    # --- B1 again: SQLi in lookup ---
    query = "SELECT * FROM items WHERE id = " + item_id
    cur = get_db().cursor()
    cur.execute(query)
    row = cur.fetchone()
    return jsonify({"item": row})


if __name__ == "__main__":
    app.run(debug=True)  # D3: debug mode leaks stack traces to clients
