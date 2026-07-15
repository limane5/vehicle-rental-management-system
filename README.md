# Car Management & Rental Database System

This is a comprehensive Car Management and Rental Database application. It features an Oracle PL/SQL database backend, a Python (Flask) API layer, and an interactive React-based frontend dashboard.

## 🚀 Project Architecture

* **Database:** Oracle SQL & PL/SQL (DDL, DML, and Stored Procedures/Triggers).
* **Backend API:** Python (Flask) acting as the bridge between the database and the client.
* **Frontend:** React (JSX) dashboard to visualize and manage rentals, car inventory, and customer updates.

---

## 📁 Repository Structure

* `01_create_table.sql` - Defines the database schema and table structures.
* `02_insert_data.sql` - Populates the database with initial sample data.
* `03_select_queries.sql` - Standard queries for retrieving insights.
* `04_update_or_replace_pl.sql` - PL/SQL procedures, functions, or triggers.
* `05_declare_pl.sql` - Anonymous PL/SQL blocks for execution/testing.
* `app.py` - Flask backend application serving the API.
* `rental_dashboard.jsx` - Frontend UI component for the application dashboard.
* `requirements.txt` - Python backend dependencies.

---

## ⚙️ Setup Instructions

### 1. Database Setup
1. Open your Oracle SQL Developer or preferred SQL client.
2. Connect to your database instance.
3. Run the scripts in order:
   * Execute `01_create_table.sql` to build the tables.
   * Execute `02_insert_data.sql` to populate the tables.
   * Execute `04_update_or_replace_pl.sql` to compile the database logic.

### 2. Backend Setup
1. Navigate to the project root directory.
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
