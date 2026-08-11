"""
EXPENSE MANAGER - SQLite Database Layer
"""

import sqlite3
import os
import uuid
from datetime import datetime, timedelta
from flask import g
from werkzeug.security import generate_password_hash

DB_FILE = os.environ.get('DB_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'expense_manager.db'))

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

def month_str(d=None):
    """Get month string YYYY-MM."""
    d = d or datetime.now()
    return d.strftime('%Y-%m')

# ==================== Auth & Users ====================

def get_user_id():
    return getattr(g, 'user_id', None)

def get_user(user_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_username(username):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(user_id, name, username, password_hash):
    conn = get_connection()
    conn.execute(
        "INSERT INTO users (id, name, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, name, username, password_hash, now_iso())
    )
    conn.commit()
    conn.close()

def delete_user(user_id):
    conn = get_connection()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

def init_user_data(user_id):
    conn = get_connection()
    try:
        seed_data(conn, user_id)
    finally:
        conn.close()


# ==================== Schema ====================

def init_db():
    """Initialize database tables and seed data if needed."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS wallets (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            balance INTEGER DEFAULT 0,
            withdrawn_amount INTEGER DEFAULT 0,
            is_savings INTEGER DEFAULT 0,
            icon TEXT DEFAULT '💰',
            color TEXT DEFAULT '#7C3AED',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS categories (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            type TEXT CHECK(type IN ('expense', 'income')),
            color TEXT
        );

        CREATE TABLE IF NOT EXISTS transactions (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            id TEXT PRIMARY KEY,
            wallet_id TEXT REFERENCES wallets(id) ON DELETE CASCADE,
            type TEXT CHECK(type IN ('expense', 'income')),
            amount INTEGER NOT NULL,
            category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
            note TEXT DEFAULT '',
            date TEXT NOT NULL,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS goals (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_amount INTEGER NOT NULL,
            current_amount INTEGER DEFAULT 0,
            withdrawn_amount INTEGER DEFAULT 0,
            start_date TEXT,
            end_date TEXT,
            icon TEXT DEFAULT '🎯',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            key TEXT,
            value TEXT,
            PRIMARY KEY (user_id, key)
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
    ''')

    try:
        cursor.execute("ALTER TABLE goals ADD COLUMN withdrawn_amount INTEGER DEFAULT 0")
    except:
        pass
        
    try:
        cursor.execute("ALTER TABLE wallets ADD COLUMN is_savings INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE wallets ADD COLUMN withdrawn_amount INTEGER DEFAULT 0")
    except:
        pass

    # MIGRATION: Add user_id to existing tables
    for table in ['wallets', 'categories', 'transactions', 'goals']:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN user_id TEXT")
        except:
            pass
            
    # Settings is a bit complex due to changing primary key.
    # We will safely recreate the table.
    try:
        # First ensure user_id column exists
        try:
            cursor.execute("ALTER TABLE settings ADD COLUMN user_id TEXT")
        except:
            pass
            
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings_new (
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                key TEXT,
                value TEXT,
                PRIMARY KEY (user_id, key)
            )
        ''')
        
        # We don't copy old settings to settings_new immediately here
        # We wait until the admin migration assigns user_id to old records,
        # but wait, we need to do this carefully.
    except Exception as e:
        print("Settings migration column error:", e)

    conn.commit()

    # Migration logic for existing data
    admin_user = cursor.execute("SELECT id FROM users WHERE username = 'thuysmao'").fetchone()
    if not admin_user:
        admin_id = generate_id()
        cursor.execute(
            "INSERT INTO users (id, name, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (admin_id, 'ThuysMao', 'thuysmao', generate_password_hash('1234'), now_iso())
        )
        
        # Migrate all existing records where user_id is NULL
        for table in ['wallets', 'categories', 'transactions', 'goals', 'settings']:
            cursor.execute(f"UPDATE {table} SET user_id = ? WHERE user_id IS NULL", (admin_id,))
        
        conn.commit()

    # Now that user_id is populated for old settings, we can migrate settings safely
    try:
        # Check if settings has the old schema (primary key on 'key' only) by checking if settings_new exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='settings_new'")
        if cursor.fetchone():
            cursor.execute("INSERT OR IGNORE INTO settings_new (user_id, key, value) SELECT user_id, key, value FROM settings WHERE user_id IS NOT NULL")
            cursor.execute("DROP TABLE settings")
            cursor.execute("ALTER TABLE settings_new RENAME TO settings")
            conn.commit()
    except Exception as e:
        print("Settings table recreation error:", e)

    conn.close()


# ==================== Seed Data ====================

def seed_data(conn, user_id=None):
    """Insert default categories and one empty wallet."""
    if not user_id:
        user_id = get_user_id()
        
    cursor = conn.cursor()

    # Categories
    categories = [
        (user_id, 'cat_food_' + user_id, 'Ăn uống', '🍜', 'expense', '#F97316'),
        (user_id, 'cat_transport_' + user_id, 'Di chuyển', '🚗', 'expense', '#3B82F6'),
        (user_id, 'cat_shopping_' + user_id, 'Mua sắm', '🛒', 'expense', '#EC4899'),
        (user_id, 'cat_housing_' + user_id, 'Nhà ở', '🏠', 'expense', '#8B5CF6'),
        (user_id, 'cat_bills_' + user_id, 'Hóa đơn', '⚡', 'expense', '#EAB308'),
        (user_id, 'cat_entertainment_' + user_id, 'Giải trí', '🎮', 'expense', '#10B981'),
        (user_id, 'cat_health_' + user_id, 'Sức khỏe', '💊', 'expense', '#EF4444'),
        (user_id, 'cat_education_' + user_id, 'Giáo dục', '📚', 'expense', '#6366F1'),
        (user_id, 'cat_other_expense_' + user_id, 'Khác', '✨', 'expense', '#6B7280'),
        (user_id, 'cat_salary_' + user_id, 'Lương', '💼', 'income', '#10B981'),
        (user_id, 'cat_bonus_' + user_id, 'Thưởng', '💰', 'income', '#F59E0B'),
        (user_id, 'cat_investment_' + user_id, 'Đầu tư', '📈', 'income', '#3B82F6'),
        (user_id, 'cat_gift_' + user_id, 'Quà tặng', '🎁', 'income', '#EC4899'),
        (user_id, 'cat_freelance_' + user_id, 'Freelance', '💻', 'income', '#8B5CF6'),
        (user_id, 'cat_other_income_' + user_id, 'Khác', '✨', 'income', '#6B7280'),
    ]
    cursor.executemany(
        "INSERT INTO categories (user_id, id, name, icon, type, color) VALUES (?, ?, ?, ?, ?, ?)",
        categories
    )

    # Wallet
    wallet_id = generate_id()
    cursor.execute("INSERT INTO wallets (user_id, id, name, balance, icon, is_savings, withdrawn_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 (user_id, wallet_id, 'Ví tiền mặt', 0, '💰', 0, 0))
                 
    # Savings Wallet
    savings_id = generate_id()
    cursor.execute("INSERT INTO wallets (user_id, id, name, balance, icon, is_savings, withdrawn_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 (user_id, savings_id, 'Ví Tiết kiệm', 0, '🏦', 1, 0))
                 
    conn.commit()

    # Active wallet setting
    cursor.execute(
        "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)",
        (user_id, 'active_wallet_id', wallet_id)
    )

    conn.commit()


# ==================== Wallets ====================

def get_wallets():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM wallets WHERE user_id = ? ORDER BY is_savings ASC, created_at ASC", (get_user_id(),)).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        result.append({
            'id': d['id'],
            'name': d['name'],
            'balance': d['balance'],
            'icon': d['icon'],
            'color': d['color'],
            'isSavings': bool(d.get('is_savings', 0)),
            'withdrawnAmount': d.get('withdrawn_amount', 0),
            'createdAt': d['created_at']
        })
    return result

def get_savings_wallet():
    conn = get_connection()
    row = conn.execute("SELECT * FROM wallets WHERE user_id = ? AND is_savings = 1 LIMIT 1", (get_user_id(),)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    return {
        'id': d['id'],
        'name': d['name'],
        'balance': d['balance'],
        'icon': d['icon'],
        'color': d['color'],
        'isSavings': True,
        'withdrawnAmount': d.get('withdrawn_amount', 0),
        'createdAt': d['created_at']
    }


def get_wallet(wallet_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM wallets WHERE id = ? AND user_id = ?", (wallet_id, get_user_id())).fetchone()
    conn.close()
    return dict(row) if row else None


def add_wallet(data):
    conn = get_connection()
    wallet_id = generate_id()
    conn.execute(
        "INSERT INTO wallets (user_id, id, name, balance, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (get_user_id(), wallet_id, data['name'], data.get('balance', 0),
         data.get('icon', '💰'), data.get('color', '#7C3AED'), now_iso())
    )
    conn.commit()
    conn.close()
    return get_wallet(wallet_id)


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
        values.append(get_user_id())
        conn.execute(f"UPDATE wallets SET {', '.join(fields)} WHERE id = ? AND user_id = ?", values)
        conn.commit()
    conn.close()
    return get_wallet(wallet_id)


def delete_wallet(wallet_id):
    conn = get_connection()
    conn.execute("DELETE FROM transactions WHERE wallet_id = ? AND user_id = ?", (wallet_id, get_user_id()))
    conn.execute("DELETE FROM wallets WHERE id = ? AND user_id = ?", (wallet_id, get_user_id()))
    conn.commit()
    conn.close()

def get_primary_wallet_id():
    conn = get_connection()
    user_id = get_user_id()
    row = conn.execute("SELECT value FROM settings WHERE key = 'active_wallet_id' AND user_id = ?", (user_id,)).fetchone()
    active_id = row['value'] if row and row['value'] else None
    
    if active_id:
        wallet = conn.execute("SELECT is_savings FROM wallets WHERE id = ? AND user_id = ?", (active_id, user_id)).fetchone()
        if not wallet or wallet['is_savings'] == 1:
            active_id = None
            
    if not active_id:
        first = conn.execute("SELECT id FROM wallets WHERE is_savings = 0 AND user_id = ? ORDER BY created_at LIMIT 1", (user_id,)).fetchone()
        if first:
            active_id = first['id']
            
    conn.close()
    return active_id

def deposit_savings(amount):
    conn = get_connection()
    user_id = get_user_id()
    savings = conn.execute("SELECT * FROM wallets WHERE is_savings = 1 AND user_id = ? LIMIT 1", (user_id,)).fetchone()
    target_id = get_primary_wallet_id()
    
    if not savings or not target_id:
        conn.close()
        return None
        
    conn.execute("UPDATE wallets SET balance = balance - ? WHERE id = ? AND user_id = ?", (amount, target_id, user_id))
    conn.execute("UPDATE wallets SET balance = balance + ?, withdrawn_amount = MAX(0, withdrawn_amount - ?) WHERE id = ? AND user_id = ?", (amount, amount, savings['id'], user_id))
    conn.commit()
    conn.close()
    return get_savings_wallet()

def withdraw_savings(amount):
    conn = get_connection()
    user_id = get_user_id()
    savings = conn.execute("SELECT * FROM wallets WHERE is_savings = 1 AND user_id = ? LIMIT 1", (user_id,)).fetchone()
    target_id = get_primary_wallet_id()
    
    if not savings or not target_id:
        conn.close()
        return None
        
    conn.execute("UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?", (amount, target_id, user_id))
    conn.execute("UPDATE wallets SET balance = balance - ?, withdrawn_amount = withdrawn_amount + ? WHERE id = ? AND user_id = ?", (amount, amount, savings['id'], user_id))
    conn.commit()
    conn.close()
    return get_savings_wallet()


def get_active_wallet_id():
    conn = get_connection()
    row = conn.execute("SELECT value FROM settings WHERE key = 'active_wallet_id' AND user_id = ?", (get_user_id(),)).fetchone()
    conn.close()
    if row:
        return row['value']
    wallets = get_wallets()
    return wallets[0]['id'] if wallets else None


def set_active_wallet_id(wallet_id):
    conn = get_connection()
    user_id = get_user_id()
    conn.execute("DELETE FROM settings WHERE key = 'active_wallet_id' AND user_id = ?", (user_id,))
    conn.execute(
        "INSERT INTO settings (user_id, key, value) VALUES (?, 'active_wallet_id', ?)",
        (user_id, wallet_id)
    )
    conn.commit()
    conn.close()


# ==================== Categories ====================

def get_categories(cat_type=None):
    conn = get_connection()
    if cat_type:
        rows = conn.execute("SELECT * FROM categories WHERE type = ? AND user_id = ?", (cat_type, get_user_id())).fetchall()
    else:
        rows = conn.execute("SELECT * FROM categories WHERE user_id = ?", (get_user_id(),)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_category(cat_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM categories WHERE id = ? AND user_id = ?", (cat_id, get_user_id())).fetchone()
    conn.close()
    return dict(row) if row else None


def add_category(data):
    conn = get_connection()
    cat_id = generate_id()
    conn.execute(
        "INSERT INTO categories (user_id, id, name, icon, type, color) VALUES (?, ?, ?, ?, ?, ?)",
        (get_user_id(), cat_id, data['name'], data.get('icon', '✨'),
         data['type'], data.get('color', '#6B7280'))
    )
    conn.commit()
    conn.close()
    return get_category(cat_id)


def delete_category(cat_id):
    conn = get_connection()
    conn.execute("DELETE FROM categories WHERE id = ? AND user_id = ?", (cat_id, get_user_id()))
    conn.commit()
    conn.close()


# ==================== Transactions ====================

def get_transactions(filters=None):
    filters = filters or {}
    conn = get_connection()

    query = "SELECT * FROM transactions WHERE user_id = ?"
    params = [get_user_id()]

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
        query += " AND (note LIKE ? OR category_id IN (SELECT id FROM categories WHERE name LIKE ? AND user_id = ?))"
        search_term = f"%{filters['search']}%"
        params.extend([search_term, search_term, get_user_id()])

    query += " ORDER BY date DESC, created_at DESC"

    if filters.get('limit'):
        query += " LIMIT ?"
        params.append(int(filters['limit']))

    rows = conn.execute(query, params).fetchall()
    conn.close()

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
    user_id = get_user_id()

    conn.execute(
        "INSERT INTO transactions (user_id, id, wallet_id, type, amount, category_id, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, tx_id, data['walletId'], data['type'], amount,
         data['categoryId'], data.get('note', ''),
         data.get('date', today_str()), now_iso())
    )

    balance_change = amount if data['type'] == 'income' else -amount
    conn.execute(
        "UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?",
        (balance_change, data['walletId'], user_id)
    )

    conn.commit()
    conn.close()
    return get_transaction(tx_id)


def get_transaction(tx_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (tx_id, get_user_id())).fetchone()
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
    user_id = get_user_id()

    old = conn.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id)).fetchone()
    if not old:
        conn.close()
        return None
    old = dict(old)

    old_change = -old['amount'] if old['type'] == 'income' else old['amount']
    conn.execute("UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?",
                 (old_change, old['wallet_id'], user_id))

    new_amount = abs(data.get('amount', old['amount']))
    new_type = data.get('type', old['type'])
    new_wallet_id = data.get('walletId', old['wallet_id'])
    new_category_id = data.get('categoryId', old['category_id'])
    new_note = data.get('note', old['note'])
    new_date = data.get('date', old['date'])

    conn.execute(
        "UPDATE transactions SET wallet_id=?, type=?, amount=?, category_id=?, note=?, date=? WHERE id=? AND user_id=?",
        (new_wallet_id, new_type, new_amount, new_category_id, new_note, new_date, tx_id, user_id)
    )

    new_change = new_amount if new_type == 'income' else -new_amount
    conn.execute("UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?",
                 (new_change, new_wallet_id, user_id))

    conn.commit()
    conn.close()
    return get_transaction(tx_id)


def delete_transaction(tx_id):
    conn = get_connection()
    user_id = get_user_id()
    tx = conn.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id)).fetchone()
    if not tx:
        conn.close()
        return

    tx = dict(tx)
    revert = -tx['amount'] if tx['type'] == 'income' else tx['amount']
    conn.execute("UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?",
                 (revert, tx['wallet_id'], user_id))

    conn.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
    conn.commit()
    conn.close()


# ==================== Statistics ====================

def get_today_summary(wallet_id=None):
    conn = get_connection()
    td = today_str()
    user_id = get_user_id()

    query_base = "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date = ? AND type = ? AND user_id = ?"

    if wallet_id:
        query_base += " AND wallet_id = ?"
        income = conn.execute(query_base, [td, 'income', user_id, wallet_id]).fetchone()[0]
        expense = conn.execute(query_base, [td, 'expense', user_id, wallet_id]).fetchone()[0]
    else:
        income = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date = ? AND type = 'income' AND user_id = ?",
            (td, user_id)
        ).fetchone()[0]
        expense = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date = ? AND type = 'expense' AND user_id = ?",
            (td, user_id)
        ).fetchone()[0]

    conn.close()
    return {'income': income, 'expense': expense}


def get_month_summary(month_str_val, wallet_id=None):
    conn = get_connection()
    user_id = get_user_id()

    base = "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date LIKE ? AND type = ? AND user_id = ?"

    if wallet_id:
        base += " AND wallet_id = ?"
        income = conn.execute(base, [month_str_val + '%', 'income', user_id, wallet_id]).fetchone()[0]
        expense = conn.execute(base, [month_str_val + '%', 'expense', user_id, wallet_id]).fetchone()[0]
    else:
        income = conn.execute(base, [month_str_val + '%', 'income', user_id]).fetchone()[0]
        expense = conn.execute(base, [month_str_val + '%', 'expense', user_id]).fetchone()[0]

    conn.close()
    return {'income': income, 'expense': expense}


def get_monthly_trend(num_months=6, wallet_id=None):
    today = datetime.now()
    result = []
    for i in range(num_months - 1, -1, -1):
        d = today.replace(day=1) - timedelta(days=i * 30)
        m = month_str(d)
        summary = get_month_summary(m, wallet_id)
        result.append({
            'month': m,
            'income': summary['income'],
            'expense': summary['expense'],
            'balance': summary['income'] - summary['expense']
        })
    return result


def get_category_breakdown(cat_type='expense', month_str_val=None, wallet_id=None):
    if not month_str_val:
        month_str_val = month_str()

    conn = get_connection()
    user_id = get_user_id()
    query = "SELECT category_id, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date LIKE ? AND user_id = ?"
    params = [cat_type, month_str_val + '%', user_id]
    
    if wallet_id:
        query += " AND wallet_id = ?"
        params.append(wallet_id)
        
    query += " GROUP BY category_id ORDER BY total DESC"
    
    rows = conn.execute(query, params).fetchall()
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
    user_id = get_user_id()
    rows = conn.execute("SELECT * FROM goals WHERE id != 'global_savings' AND user_id = ? ORDER BY created_at", (user_id,)).fetchall()
    total_row = conn.execute("SELECT COALESCE(SUM(balance), 0) as total FROM wallets WHERE user_id = ?", (user_id,)).fetchone()
    total = total_row['total'] if total_row else 0
    conn.close()
    
    result = []
    for r in rows:
        d = dict(r)
        result.append({
            'id': d['id'],
            'name': d['name'],
            'targetAmount': d['target_amount'],
            'currentAmount': d['current_amount'],
            'withdrawnAmount': d.get('withdrawn_amount') or 0,
            'walletBalance': total,
            'startDate': d['start_date'],
            'endDate': d['end_date'],
            'icon': d['icon'],
            'createdAt': d['created_at']
        })
    return result


def get_goal(goal_id):
    conn = get_connection()
    user_id = get_user_id()
    row = conn.execute("SELECT * FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id)).fetchone()
    total_row = conn.execute("SELECT COALESCE(SUM(balance), 0) as total FROM wallets WHERE user_id = ?", (user_id,)).fetchone()
    total = total_row['total'] if total_row else 0
    conn.close()
    
    if not row:
        return None
    d = dict(row)
    return {
        'id': d['id'],
        'name': d['name'],
        'targetAmount': d['target_amount'],
        'currentAmount': d['current_amount'],
        'withdrawnAmount': d.get('withdrawn_amount') or 0,
        'walletBalance': total,
        'startDate': d['start_date'],
        'endDate': d['end_date'],
        'icon': d['icon'],
        'createdAt': d['created_at']
    }


def add_goal(data):
    conn = get_connection()
    goal_id = data.get('id') or generate_id()
    conn.execute(
        "INSERT INTO goals (user_id, id, name, target_amount, current_amount, withdrawn_amount, start_date, end_date, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (get_user_id(), goal_id, data['name'], data['targetAmount'],
         data.get('currentAmount', 0),
         data.get('withdrawnAmount', 0),
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
        'withdrawnAmount': 'withdrawn_amount',
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
        values.append(get_user_id())
        conn.execute(f"UPDATE goals SET {', '.join(fields)} WHERE id = ? AND user_id = ?", values)
        conn.commit()
    conn.close()
    return get_goal(goal_id)


def delete_goal(goal_id):
    conn = get_connection()
    conn.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (goal_id, get_user_id()))
    conn.commit()
    conn.close()


def add_funds_to_goal(goal_id, amount):
    conn = get_connection()
    user_id = get_user_id()
    goal = conn.execute("SELECT * FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id)).fetchone()
    if not goal:
        conn.close()
        return None
    
    current = goal['current_amount']
    withdrawn = goal.get('withdrawn_amount') or 0
    actual_amount = 0
    
    if amount > 0:
        actual_amount = amount
        if withdrawn > 0:
            if amount >= withdrawn:
                withdrawn = 0
            else:
                withdrawn -= amount
        current += amount
    else:
        withdraw_amount = abs(amount)
        if current < withdraw_amount:
            withdraw_amount = current
        current -= withdraw_amount
        withdrawn += withdraw_amount
        actual_amount = -withdraw_amount
        
    conn.execute(
        "UPDATE goals SET current_amount = ?, withdrawn_amount = ? WHERE id = ? AND user_id = ?",
        (current, withdrawn, goal_id, user_id)
    )
    
    if actual_amount != 0:
        active_wallet = conn.execute("SELECT value FROM settings WHERE key = 'active_wallet_id' AND user_id = ?", (user_id,)).fetchone()
        if active_wallet:
            active_wallet_id = active_wallet['value']
            conn.execute("UPDATE wallets SET balance = balance - ? WHERE id = ? AND user_id = ?", (actual_amount, active_wallet_id, user_id))
            
            cat_type = 'expense' if actual_amount > 0 else 'income'
            cat_name = 'Nạp tiết kiệm' if actual_amount > 0 else 'Rút tiết kiệm'
            cat_icon = '🏦'
            cat_color = '#10B981' if actual_amount < 0 else '#F59E0B'
            cat_id = f"cat_goal_{cat_type}_{user_id}"
            
            cat_exists = conn.execute("SELECT id FROM categories WHERE id = ? AND user_id = ?", (cat_id, user_id)).fetchone()
            if not cat_exists:
                conn.execute(
                    "INSERT INTO categories (user_id, id, name, icon, type, color) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_id, cat_id, cat_name, cat_icon, cat_type, cat_color)
                )
                
            tx_id = generate_id()
            conn.execute(
                "INSERT INTO transactions (user_id, id, wallet_id, category_id, amount, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (user_id, tx_id, active_wallet_id, cat_id, abs(actual_amount), f"{'Nạp vào' if actual_amount > 0 else 'Rút từ'}: {goal['name']}", today_str(), now_iso())
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
    # Disabled for multi-user
    return False

def reset_data():
    user_id = get_user_id()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM wallets WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM categories WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM settings WHERE user_id = ?", (user_id,))
    conn.commit()
    seed_data(conn, user_id)
    conn.close()
