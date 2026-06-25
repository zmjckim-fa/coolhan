"""
app-clean — same feature (login + item lookup) done securely.
Parameterized queries, env secrets, ownership/authz, bcrypt, server-side validation.
"""
import os
import re
import sqlite3

import bcrypt
from flask import Flask, request, jsonify, g

app = Flask(__name__)

# --- C1: secrets from environment, not source ---
DB_PASSWORD = os.environ["DB_PASSWORD"]
API_KEY = os.environ["THIRDPARTY_API_KEY"]
app.secret_key = os.environ["FLASK_SECRET_KEY"]

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,32}$")


def get_db():
    conn = sqlite3.connect("app.db")
    conn.row_factory = sqlite3.Row
    return conn


def current_user_id():
    # A2/A3: server-side session-derived identity (not a client-supplied flag)
    token = request.headers.get("Authorization", "")
    return verify_token(token)  # returns user_id or None


def verify_token(token):
    # placeholder for signed-token verification (expiry checked, server-side)
    return g.get("test_user_id")  # injected by auth middleware in real deploy


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    # --- B4: server-side input validation ---
    if not USERNAME_RE.match(username) or not (8 <= len(password) <= 128):
        return jsonify({"error": "invalid input"}), 400

    # --- B1: parameterized query (no string concatenation) ---
    cur = get_db().cursor()
    cur.execute(
        "SELECT id, password_hash FROM users WHERE username = ?",
        (username,),
    )
    row = cur.fetchone()
    if not row:
        return jsonify({"error": "invalid credentials"}), 401  # D3: no detail leak

    # --- A2: bcrypt verification (no plaintext / MD5) ---
    if not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        return jsonify({"error": "invalid credentials"}), 401

    return jsonify({"token": issue_token(row["id"])})  # C3: no secret leaked


def issue_token(user_id):
    return "signed-token-for-%d" % user_id  # placeholder; real impl signs + expiry


@app.route("/item/<int:item_id>", methods=["GET"])
def get_item(item_id):
    # --- A1: authn required + ownership check (deny-by-default) ---
    uid = current_user_id()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401

    # --- B1: parameterized query; A1: scoped to owner_id ---
    cur = get_db().cursor()
    cur.execute(
        "SELECT id, name, owner_id FROM items WHERE id = ? AND owner_id = ?",
        (item_id, uid),
    )
    row = cur.fetchone()
    if row is None:
        return jsonify({"error": "not found"}), 404  # no IDOR leak
    return jsonify({"item": {"id": row["id"], "name": row["name"]}})


if __name__ == "__main__":
    app.run(debug=False)  # D3: debug off in production
