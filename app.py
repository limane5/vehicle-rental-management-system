"""
app.py
Minimal Flask API in front of the Oracle analytics views
(10_innovation_analytics.sql). Exposes each view as a JSON endpoint
so the React dashboard (rental_dashboard.jsx) can fetch live data
instead of the built-in sample arrays.

Run:
    pip install -r requirements.txt
    set ORACLE_USER=...        (Windows: set / macOS-Linux: export)
    set ORACLE_PASSWORD=...
    set ORACLE_DSN=localhost:1521/XEPDB1
    python app.py

Then in rental_dashboard.jsx, replace the hardcoded arrays with
fetch("http://localhost:5000/api/revenue-by-brand") etc.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
import oracledb

app = Flask(__name__)
CORS(app)  # allow the dashboard (running on a different origin) to call this API

DB_USER = os.environ.get("ORACLE_USER", "your_db_user")
DB_PASSWORD = os.environ.get("ORACLE_PASSWORD", "your_db_password")
DB_DSN = os.environ.get("ORACLE_DSN", "localhost:1521/XEPDB1")


def get_connection():
    return oracledb.connect(user=DB_USER, password=DB_PASSWORD, dsn=DB_DSN)


def rows_to_dicts(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def query_view(view_name, order_by=None):
    sql = f"SELECT * FROM {view_name}"
    if order_by:
        sql += f" ORDER BY {order_by}"
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql)
            return rows_to_dicts(cursor)


@app.route("/api/revenue-by-brand")
def revenue_by_brand():
    try:
        data = query_view("VW_REVENUE_BY_BRAND", order_by="TOTAL_REVENUE DESC")
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/monthly-revenue")
def monthly_revenue():
    try:
        data = query_view("VW_MONTHLY_REVENUE", order_by="REVENUE_MONTH")
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/fleet-utilization")
def fleet_utilization():
    try:
        data = query_view("VW_FLEET_UTILIZATION")
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/top-customers")
def top_customers():
    try:
        data = query_view("VW_TOP_CUSTOMERS", order_by="TOTAL_SPEND DESC")
        return jsonify(data[:5])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/active-rentals")
def active_rentals():
    try:
        data = query_view("VW_RENTAL_DETAILS")
        active = [r for r in data if r.get("RETURN_DATE") is None]
        return jsonify(active)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
