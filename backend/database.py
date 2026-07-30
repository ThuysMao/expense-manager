"""
EXPENSE MANAGER - SQLite Database Layer
"""

import sqlite3
import os
import uuid
from datetime import datetime, timedelta

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'expense_manager.db')


def get_connection():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def generate_id():
    """Generate a unique ID."""
    return uuid.uuid4().hex[:16]


def now_iso():
    """Get current ISO timestamp."""
    return datetime.now().isoformat()


def today_str():
    """Get today's date as YYYY-MM-DD."""
    return datetime.now().strftime('%Y-%m-%d')


def date_to_str(d):
    """Convert date object to YYYY-MM-DD string."""
    return d.strftime('%Y-%m-%d')


def month_str(d=None):
    """Get month string YYYY-MM."""
    d = d or datetime.now()
    return d.strftime('%Y-%m')


# ==================== Schema ====================

def init_db():
    """Initialize database tables and seed data if needed."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS wallets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            balance INTEGER DEFAULT 0,
            icon TEXT DEFAULT '💰',
            color TEXT DEFAULT '#7C3AED',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            type TEXT CHECK(type IN ('expense', 'income')),
            color TEXT
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            wallet_id TEXT REFERENCES wallets(id) ON DELETE CASCADE,
            type TEXT CHECK(type IN ('expense', 'income')),
            amount INTEGER NOT NULL,
            category_id TEXT REFERENCES categories(id),
            note TEXT DEFAULT '',
            date TEXT NOT NULL,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_amount INTEGER NOT NULL,
            current_amount INTEGER DEFAULT 0,
            start_date TEXT,
            end_date TEXT,
            icon TEXT DEFAULT '🎯',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
    ''')

    conn.commit()

    # Seed if empty
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        seed_data(conn)

    conn.close()


# ==================== Seed Data ====================

def seed_data(conn):
    """Insert default categories and one empty wallet."""
    cursor = conn.cursor()
    ts = now_iso()

    # Categories
    categories = [
        ('cat_food', 'Ăn uống', '🍜', 'expense', '#F97316'),
        ('cat_transport', 'Di chuyển', '🚗', 'expense', '#3B82F6'),
        ('cat_shopping', 'Mua sắm', '🛒', 'expense', '#EC4899'),
        ('cat_housing', 'Nhà ở', '🏠', 'expense', '#8B5CF6'),
        ('cat_bills', 'Hóa đơn', '⚡', 'expense', '#EAB308'),
        ('cat_entertainment', 'Giải trí', '🎮', 'expense', '#10B981'),
        ('cat_health', 'Sức khỏe', '💊', 'expense', '#EF4444'),
        ('cat_education', 'Giáo dục', '📚', 'expense', '#6366F1'),
        ('cat_other_expense', 'Khác', '✨', 'expense', '#6B7280'),
        ('cat_salary', 'Lương', '💼', 'income', '#10B981'),
        ('cat_bonus', 'Thưởng', '💰', 'income', '#F59E0B'),
        ('cat_investment', 'Đầu tư', '📈', 'income', '#3B82F6'),
        ('cat_gift', 'Quà tặng', '🎁', 'income', '#EC4899'),
        ('cat_freelance', 'Freelance', '💻', 'income', '#8B5CF6'),
        ('cat_other_income', 'Khác', '✨', 'income', '#6B7280'),
    ]
    cursor.executemany(
        "INSERT INTO categories (id, name, icon, type, color) VALUES (?, ?, ?, ?, ?)",
        categories
    )

    # Wallet
    wallet_id = generate_id()
    cursor.execute(
        "INSERT INTO wallets (id, name, balance, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (wallet_id, 'Ví cá nhân', 0, '💳', '#7C3AED', ts)
    )

    # Active wallet setting
    cursor.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        ('active_wallet_id', wallet_id)
    )

    conn.commit()


# ==================== Wallets ====================

def get_wallets():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM wallets ORDER BY created_at").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_wallet(wallet_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def add_wallet(data):
    conn = get_connection()
    wallet_id = generate_id()
    conn.execute(
        "INSERT INTO wallets (id, name, balance, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (wallet_id, data['name'], data.get('balance', 0),
         data.get('icon', '💰'), data.get('color', '#7C3AED'), now_iso())
    )
    conn.commit()
    wallet = get_wallet(wallet_id)
    conn.close()
    return wallet


def update_wallet(wallet_id, data):
    conn = get_connection()
    fields = []
    values = []
    for key in ['name', 'balance', 'icon', 'color']:
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if fields:
        values.append(wallet_id)
        conn.execute(f"UPDATE wallets SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
    conn.close()
    return get_wallet(wallet_id)


def delete_wallet(wallet_id):
    conn = get_connection()
    conn.execute("DELETE FROM transactions WHERE wallet_id = ?", (wallet_id,))
    conn.execute("DELETE FROM wallets WHERE id = ?", (wallet_id,))
    conn.commit()
    conn.close()



def get_active_wallet_id():
    conn = get_connection()
    row = conn.execute("SELECT value FROM settings WHERE key = 'active_wallet_id'").fetchone()
    conn.close()
    if row:
        return row['value']
    wallets = get_wallets()
    return wallets[0]['id'] if wallets else None


def set_active_wallet_id(wallet_id):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_wallet_id', ?)",
        (wallet_id,)
    )
    conn.commit()
    conn.close()


# ==================== Categories ====================

def get_categories(cat_type=None):
    conn = get_connection()
    if cat_type:
        rows = conn.execute("SELECT * FROM categories WHERE type = ?", (cat_type,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM categories").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_category(cat_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM categories WHERE id = ?", (cat_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def add_category(data):
    conn = get_connection()
    cat_id = generate_id()
    conn.execute(
        "INSERT INTO categories (id, name, icon, type, color) VALUES (?, ?, ?, ?, ?)",
        (cat_id, data['name'], data.get('icon', '✨'),
         data['type'], data.get('color', '#6B7280'))
    )
    conn.commit()
    conn.close()
    return get_category(cat_id)


def delete_category(cat_id):
    conn = get_connection()
    conn.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    conn.commit()
    conn.close()


# ==================== Transactions ====================

def get_transactions(filters=None):
    filters = filters or {}
    conn = get_connection()

    query = "SELECT * FROM transactions WHERE 1=1"
    params = []

    if filters.get('type') and filters['type'] != 'all':
        query += " AND type = ?"
        params.append(filters['type'])

    if filters.get('walletId'):
        query += " AND wallet_id = ?"
        params.append(filters['walletId'])

    if filters.get('categoryId'):
        query += " AND category_id = ?"
        params.append(filters['categoryId'])

    if filters.get('dateFrom'):
        query += " AND date >= ?"
        params.append(filters['dateFrom'])

    if filters.get('dateTo'):
        query += " AND date <= ?"
        params.append(filters['dateTo'])

    if filters.get('month'):
        query += " AND date LIKE ?"
        params.append(filters['month'] + '%')

    if filters.get('search'):
        query += " AND (note LIKE ? OR category_id IN (SELECT id FROM categories WHERE name LIKE ?))"
        search_term = f"%{filters['search']}%"
        params.extend([search_term, search_term])

    query += " ORDER BY date DESC, created_at DESC"

    if filters.get('limit'):
        query += " LIMIT ?"
        params.append(int(filters['limit']))

    rows = conn.execute(query, params).fetchall()
    conn.close()

    # Convert to camelCase dict
    result = []
    for r in rows:
        d = dict(r)
        result.append({
            'id': d['id'],
            'walletId': d['wallet_id'],
            'type': d['type'],
            'amount': d['amount'],
            'categoryId': d['category_id'],
            'note': d['note'],
            'date': d['date'],
            'createdAt': d['created_at']
        })
    return result


def add_transaction(data):
    conn = get_connection()
    tx_id = generate_id()
    amount = abs(data['amount'])

    conn.execute(
        "INSERT INTO transactions (id, wallet_id, type, amount, category_id, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (tx_id, data['walletId'], data['type'], amount,
         data['categoryId'], data.get('note', ''),
         data.get('date', today_str()), now_iso())
    )

    # Update wallet balance
    balance_change = amount if data['type'] == 'income' else -amount
    conn.execute(
        "UPDATE wallets SET balance = balance + ? WHERE id = ?",
        (balance_change, data['walletId'])
    )

    conn.commit()
    conn.close()
    return get_transaction(tx_id)


def get_transaction(tx_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    return {
        'id': d['id'],
        'walletId': d['wallet_id'],
        'type': d['type'],
        'amount': d['amount'],
        'categoryId': d['category_id'],
        'note': d['note'],
        'date': d['date'],
        'createdAt': d['created_at']
    }


def update_transaction(tx_id, data):
    conn = get_connection()

    # Get old transaction to revert balance
    old = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    if not old:
        conn.close()
        return None
    old = dict(old)

    # Revert old balance
    old_change = -old['amount'] if old['type'] == 'income' else old['amount']
    conn.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?",
                 (old_change, old['wallet_id']))

    # Update transaction
    new_amount = abs(data.get('amount', old['amount']))
    new_type = data.get('type', old['type'])
    new_wallet_id = data.get('walletId', old['wallet_id'])
    new_category_id = data.get('categoryId', old['category_id'])
    new_note = data.get('note', old['note'])
    new_date = data.get('date', old['date'])

    conn.execute(
        "UPDATE transactions SET wallet_id=?, type=?, amount=?, category_id=?, note=?, date=? WHERE id=?",
        (new_wallet_id, new_type, new_amount, new_category_id, new_note, new_date, tx_id)
    )

    # Apply new balance
    new_change = new_amount if new_type == 'income' else -new_amount
    conn.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?",
                 (new_change, new_wallet_id))

    conn.commit()
    conn.close()
    return get_transaction(tx_id)


def delete_transaction(tx_id):
    conn = get_connection()
    tx = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    if not tx:
        conn.close()
        return

    tx = dict(tx)
    # Revert balance
    revert = -tx['amount'] if tx['type'] == 'income' else tx['amount']
    conn.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?",
                 (revert, tx['wallet_id']))

    conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    conn.commit()
    conn.close()


# ==================== Statistics ====================

def get_today_summary(wallet_id=None):
    conn = get_connection()
    td = today_str()

    query_base = "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date = ? AND type = ?"
    params_base = [td]

    if wallet_id:
        query_base += " AND wallet_id = ?"
        income = conn.execute(query_base, [td, 'income', wallet_id]).fetchone()[0]
        expense = conn.execute(query_base, [td, 'expense', wallet_id]).fetchone()[0]
    else:
        income = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date = ? AND type = 'income'",
            (td,)
        ).fetchone()[0]
        expense = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date = ? AND type = 'expense'",
            (td,)
        ).fetchone()[0]

    conn.close()
    return {'income': income, 'expense': expense}


def get_month_summary(month_str_val, wallet_id=None):
    conn = get_connection()

    base = "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date LIKE ? AND type = ?"
    params = [month_str_val + '%']

    if wallet_id:
        base += " AND wallet_id = ?"
        income = conn.execute(base, [month_str_val + '%', 'income', wallet_id]).fetchone()[0]
        expense = conn.execute(base, [month_str_val + '%', 'expense', wallet_id]).fetchone()[0]
    else:
        income = conn.execute(base, [month_str_val + '%', 'income']).fetchone()[0]
        expense = conn.execute(base, [month_str_val + '%', 'expense']).fetchone()[0]

    conn.close()
    return {'income': income, 'expense': expense}


def get_monthly_trend(num_months=6):
    today = datetime.now()
    result = []
    for i in range(num_months - 1, -1, -1):
        d = today.replace(day=1) - timedelta(days=i * 30)
        m = month_str(d)
        summary = get_month_summary(m)
        result.append({
            'month': m,
            'income': summary['income'],
            'expense': summary['expense'],
            'balance': summary['income'] - summary['expense']
        })
    return result


def get_category_breakdown(cat_type='expense', month_str_val=None):
    if not month_str_val:
        month_str_val = month_str()

    conn = get_connection()
    rows = conn.execute(
        "SELECT category_id, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date LIKE ? GROUP BY category_id ORDER BY total DESC",
        (cat_type, month_str_val + '%')
    ).fetchall()

    grand_total = sum(r['total'] for r in rows) or 1

    result = []
    for r in rows:
        cat = get_category(r['category_id'])
        if not cat:
            cat = {'id': r['category_id'], 'name': 'Khác', 'icon': '✨', 'color': '#6B7280'}
        percentage = round((r['total'] / grand_total) * 1000) / 10
        result.append({
            'categoryId': r['category_id'],
            'category': cat,
            'amount': r['total'],
            'count': r['count'],
            'percentage': percentage
        })

    conn.close()
    return result


# ==================== Goals ====================

def get_goals():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM goals ORDER BY created_at").fetchall()
    total = conn.execute("SELECT COALESCE(SUM(balance), 0) as total FROM wallets").fetchone()['total']
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        result.append({
            'id': d['id'],
            'name': d['name'],
            'targetAmount': d['target_amount'],
            'currentAmount': total,
            'startDate': d['start_date'],
            'endDate': d['end_date'],
            'icon': d['icon'],
            'createdAt': d['created_at']
        })
    return result


def get_goal(goal_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    total = conn.execute("SELECT COALESCE(SUM(balance), 0) as total FROM wallets").fetchone()['total']
    conn.close()
    if not row:
        return None
    d = dict(row)
    return {
        'id': d['id'],
        'name': d['name'],
        'targetAmount': d['target_amount'],
        'currentAmount': total,
        'startDate': d['start_date'],
        'endDate': d['end_date'],
        'icon': d['icon'],
        'createdAt': d['created_at']
    }


def add_goal(data):
    conn = get_connection()
    goal_id = generate_id()
    conn.execute(
        "INSERT INTO goals (id, name, target_amount, current_amount, start_date, end_date, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (goal_id, data['name'], data['targetAmount'],
         data.get('currentAmount', 0),
         data.get('startDate', today_str()),
         data.get('endDate'),
         data.get('icon', '🎯'), now_iso())
    )
    conn.commit()
    conn.close()
    return get_goal(goal_id)


def update_goal(goal_id, data):
    conn = get_connection()
    fields = []
    values = []
    field_map = {
        'name': 'name',
        'targetAmount': 'target_amount',
        'currentAmount': 'current_amount',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'icon': 'icon'
    }
    for js_key, db_key in field_map.items():
        if js_key in data:
            fields.append(f"{db_key} = ?")
            values.append(data[js_key])
    if fields:
        values.append(goal_id)
        conn.execute(f"UPDATE goals SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
    conn.close()
    return get_goal(goal_id)


def delete_goal(goal_id):
    conn = get_connection()
    conn.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
    conn.commit()
    conn.close()


def add_funds_to_goal(goal_id, amount):
    conn = get_connection()
    conn.execute(
        "UPDATE goals SET current_amount = current_amount + ? WHERE id = ?",
        (amount, goal_id)
    )
    conn.commit()
    conn.close()
    return get_goal(goal_id)


# ==================== Export / Import / Reset ====================

def export_data():
    return {
        'wallets': get_wallets(),
        'transactions': get_transactions(),
        'categories': get_categories(),
        'goals': get_goals(),
        'activeWalletId': get_active_wallet_id(),
        'exportedAt': now_iso()
    }


def import_data(data):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Clear existing data
        cursor.execute("DELETE FROM transactions")
        cursor.execute("DELETE FROM wallets")
        cursor.execute("DELETE FROM categories")
        cursor.execute("DELETE FROM goals")
        cursor.execute("DELETE FROM settings")

        # Import categories
        for c in data.get('categories', []):
            cursor.execute(
                "INSERT INTO categories (id, name, icon, type, color) VALUES (?, ?, ?, ?, ?)",
                (c['id'], c['name'], c.get('icon'), c.get('type'), c.get('color'))
            )

        # Import wallets
        for w in data.get('wallets', []):
            cursor.execute(
                "INSERT INTO wallets (id, name, balance, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (w['id'], w['name'], w.get('balance', 0),
                 w.get('icon', '💰'), w.get('color', '#7C3AED'),
                 w.get('created_at') or w.get('createdAt', now_iso()))
            )

        # Import transactions
        for t in data.get('transactions', []):
            cursor.execute(
                "INSERT INTO transactions (id, wallet_id, type, amount, category_id, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (t['id'],
                 t.get('wallet_id') or t.get('walletId'),
                 t['type'], t['amount'],
                 t.get('category_id') or t.get('categoryId'),
                 t.get('note', ''),
                 t['date'],
                 t.get('created_at') or t.get('createdAt', now_iso()))
            )

        # Import goals
        for g in data.get('goals', []):
            cursor.execute(
                "INSERT INTO goals (id, name, target_amount, current_amount, start_date, end_date, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (g['id'], g['name'],
                 g.get('target_amount') or g.get('targetAmount'),
                 g.get('current_amount') or g.get('currentAmount', 0),
                 g.get('start_date') or g.get('startDate'),
                 g.get('end_date') or g.get('endDate'),
                 g.get('icon', '🎯'),
                 g.get('created_at') or g.get('createdAt', now_iso()))
            )

        # Import active wallet
        if data.get('activeWalletId'):
            cursor.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_wallet_id', ?)",
                (data['activeWalletId'],)
            )

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"Import error: {e}")
        return False


def reset_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions")
    cursor.execute("DELETE FROM wallets")
    cursor.execute("DELETE FROM categories")
    cursor.execute("DELETE FROM goals")
    cursor.execute("DELETE FROM settings")
    conn.commit()
    seed_data(conn)
    conn.close()
