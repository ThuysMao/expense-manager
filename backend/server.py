"""
EXPENSE MANAGER - Flask API Server
"""

from flask import Flask, request, jsonify, send_from_directory, session, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import os
import database as db
import uuid

FRONTEND_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../frontend')
app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='')
app.secret_key = 'super_secret_key_for_expense_manager_123'
app.config['SESSION_COOKIE_HTTPONLY'] = True
CORS(app, supports_credentials=True)

@app.before_request
def require_login():
    if request.method == 'OPTIONS':
        return
    if request.path.startswith('/api/auth/'):
        return
    if request.path.startswith('/api/'):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        g.user_id = user_id

# ==================== Auth API ====================

@app.route('/api/auth/me', methods=['GET'])
def api_auth_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    user = db.get_user(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'id': user['id'], 'name': user['name'], 'username': user['username']})

@app.route('/api/auth/login', methods=['POST'])
def api_auth_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = db.get_user_by_username(username)
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        return jsonify({'ok': True, 'user': {'id': user['id'], 'name': user['name']}})
    return jsonify({'error': 'Sai tên đăng nhập hoặc mật khẩu'}), 401

@app.route('/api/auth/register', methods=['POST'])
def api_auth_register():
    data = request.get_json()
    name = data.get('name')
    username = data.get('username')
    password = data.get('password')
    
    if not name or not username or not password:
        return jsonify({'error': 'Vui lòng nhập đầy đủ thông tin'}), 400
        
    if db.get_user_by_username(username):
        return jsonify({'error': 'Tên đăng nhập đã tồn tại'}), 400
        
    user_id = db.generate_id()
    password_hash = generate_password_hash(password)
    db.create_user(user_id, name, username, password_hash)
    
    # Initialize basic data for new user
    db.init_user_data(user_id)
    
    session['user_id'] = user_id
    return jsonify({'ok': True, 'user': {'id': user_id, 'name': name}})

@app.route('/api/auth/logout', methods=['POST'])
def api_auth_logout():
    session.pop('user_id', None)
    return jsonify({'ok': True})

@app.route('/api/auth/delete', methods=['DELETE'])
def api_auth_delete():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    db.delete_user(user_id)
    session.pop('user_id', None)
    return jsonify({'ok': True})



# ==================== Static Files ====================

@app.route('/')
def index():
    return app.send_static_file('index.html')


# ==================== Wallets API ====================

@app.route('/api/wallets', methods=['GET'])
def api_get_wallets():
    return jsonify(db.get_wallets())


@app.route('/api/wallets', methods=['POST'])
def api_add_wallet():
    data = request.get_json()
    wallet = db.add_wallet(data)
    return jsonify(wallet), 201


@app.route('/api/wallets/<wallet_id>', methods=['PUT'])
def api_update_wallet(wallet_id):
    data = request.get_json()
    wallet = db.update_wallet(wallet_id, data)
    if not wallet:
        return jsonify({'error': 'Wallet not found'}), 404
    return jsonify(wallet)


@app.route('/api/wallets/<wallet_id>', methods=['DELETE'])
def api_delete_wallet(wallet_id):
    db.delete_wallet(wallet_id)
    return jsonify({'ok': True})


@app.route('/api/wallets/active', methods=['GET'])
def api_get_active_wallet():
    return jsonify({'id': db.get_active_wallet_id()})


@app.route('/api/wallets/active', methods=['PUT'])
def api_set_active_wallet():
    data = request.get_json()
    db.set_active_wallet_id(data['id'])
    return jsonify({'ok': True})


@app.route('/api/savings', methods=['GET'])
def api_get_savings():
    wallet = db.get_savings_wallet()
    if not wallet:
        return jsonify({'error': 'Savings wallet not found'}), 404
    return jsonify(wallet)

@app.route('/api/savings/deposit', methods=['POST'])
def api_deposit_savings():
    data = request.get_json()
    wallet = db.deposit_savings(data.get('amount', 0))
    if not wallet:
        return jsonify({'error': 'Savings wallet not found'}), 404
    return jsonify(wallet)

@app.route('/api/savings/withdraw', methods=['POST'])
def api_withdraw_savings():
    data = request.get_json()
    wallet = db.withdraw_savings(data.get('amount', 0))
    if not wallet:
        return jsonify({'error': 'Savings wallet not found'}), 404
    return jsonify(wallet)


# ==================== Categories API ====================

@app.route('/api/categories', methods=['GET'])
def api_get_categories():
    cat_type = request.args.get('type')
    return jsonify(db.get_categories(cat_type))


@app.route('/api/categories/<cat_id>', methods=['GET'])
def api_get_category(cat_id):
    cat = db.get_category(cat_id)
    if not cat:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify(cat)


@app.route('/api/categories', methods=['POST'])
def api_add_category():
    data = request.get_json()
    cat = db.add_category(data)
    return jsonify(cat), 201


@app.route('/api/categories/<cat_id>', methods=['DELETE'])
def api_delete_category(cat_id):
    db.delete_category(cat_id)
    return jsonify({'ok': True})


# ==================== Transactions API ====================

@app.route('/api/transactions', methods=['GET'])
def api_get_transactions():
    filters = {}
    for key in ['type', 'walletId', 'categoryId', 'dateFrom', 'dateTo', 'month', 'search', 'limit']:
        val = request.args.get(key)
        if val:
            filters[key] = val
    return jsonify(db.get_transactions(filters))


@app.route('/api/transactions', methods=['POST'])
def api_add_transaction():
    data = request.get_json()
    tx = db.add_transaction(data)
    return jsonify(tx), 201


@app.route('/api/transactions/<tx_id>', methods=['PUT'])
def api_update_transaction(tx_id):
    data = request.get_json()
    tx = db.update_transaction(tx_id, data)
    if not tx:
        return jsonify({'error': 'Transaction not found'}), 404
    return jsonify(tx)


@app.route('/api/transactions/<tx_id>', methods=['DELETE'])
def api_delete_transaction(tx_id):
    db.delete_transaction(tx_id)
    return jsonify({'ok': True})


# ==================== Goals API ====================

@app.route('/api/goals', methods=['GET'])
def api_get_goals():
    return jsonify(db.get_goals())


@app.route('/api/goals/<goal_id>', methods=['GET'])
def api_get_goal(goal_id):
    goal = db.get_goal(goal_id)
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    return jsonify(goal)

@app.route('/api/debug/goals', methods=['GET'])
def api_debug_goals():
    conn = db.get_connection()
    rows = conn.execute("SELECT * FROM goals").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/goals', methods=['POST'])
def api_add_goal():
    data = request.get_json()
    goal = db.add_goal(data)
    return jsonify(goal), 201


@app.route('/api/goals/<goal_id>', methods=['PUT'])
def api_update_goal(goal_id):
    data = request.get_json()
    goal = db.update_goal(goal_id, data)
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    return jsonify(goal)


@app.route('/api/goals/<goal_id>', methods=['DELETE'])
def api_delete_goal(goal_id):
    db.delete_goal(goal_id)
    return jsonify({'ok': True})


@app.route('/api/goals/<goal_id>/add-funds', methods=['POST'])
def api_add_funds_to_goal(goal_id):
    data = request.get_json()
    amount = data.get('amount', 0)
    goal = db.add_funds_to_goal(goal_id, amount)
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    return jsonify(goal)


# ==================== Statistics API ====================

@app.route('/api/stats/today', methods=['GET'])
def api_stats_today():
    wallet_id = request.args.get('walletId')
    return jsonify(db.get_today_summary(wallet_id))


@app.route('/api/stats/month', methods=['GET'])
def api_stats_month():
    month = request.args.get('month', db.month_str())
    wallet_id = request.args.get('walletId')
    return jsonify(db.get_month_summary(month, wallet_id))


@app.route('/api/stats/trend', methods=['GET'])
def api_stats_trend():
    months = int(request.args.get('months', 6))
    wallet_id = request.args.get('walletId')
    return jsonify(db.get_monthly_trend(months, wallet_id))


@app.route('/api/stats/breakdown', methods=['GET'])
def api_stats_breakdown():
    cat_type = request.args.get('type', 'expense')
    month = request.args.get('month')
    wallet_id = request.args.get('walletId')
    return jsonify(db.get_category_breakdown(cat_type, month, wallet_id))


# ==================== Export / Import / Reset ====================

@app.route('/api/export', methods=['GET'])
def api_export():
    data = db.export_data()
    return jsonify(data)


@app.route('/api/import', methods=['POST'])
def api_import():
    data = request.get_json()
    success = db.import_data(data)
    if success:
        return jsonify({'ok': True})
    return jsonify({'error': 'Import failed'}), 400


@app.route('/api/reset', methods=['POST'])
def api_reset():
    db.reset_data()
    return jsonify({'ok': True})


# ==================== Start Server ====================

# Initialize database (creates tables and seed data if needed)
db.init_db()

if __name__ == '__main__':
    print("="*50)
    print("  Expense Manager Server")
    print("  Database: expense_manager.db")
    print("  http://localhost:5000")
    print("="*50)
    app.run(host='0.0.0.0', port=5000, debug=True)
