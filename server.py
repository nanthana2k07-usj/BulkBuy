from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
import os
from datetime import datetime
import hmac
import hashlib
import json
from flask import send_from_directory

app = Flask(__name__)
CORS(app)

# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/bulkbuy')
client = MongoClient(MONGODB_URI)
db = client['bulkbuy']

# Collections
users_col = db['users']
products_col = db['products']
orders_col = db['orders']
collaborations_col = db['collaborations']

# Create unique constraint on email
users_col.create_index('email', unique=True)

print('✅ MongoDB Connected')

# ───- ROUTES ───────────────────────────────────────────────────────

# USERS
@app.route('/api/users/login', methods=['POST'])
def login():
    try:
        data = request.json
        user = users_col.find_one({'email': data['email'], 'password': data['password']})
        
        if user:
            user['_id'] = str(user['_id'])  # Convert ObjectId to string
            return jsonify({'success': True, 'user': user})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/users/register', methods=['POST'])
def register():
    try:
        data = request.json
        data['totalSavings'] = 0
        data['orders'] = 0
        data['collaborations'] = 0
        data['role'] = 'owner'
        data['joinDate'] = datetime.now().isoformat()
        data['createdAt'] = datetime.now()
        
        result = users_col.insert_one(data)
        user = users_col.find_one({'_id': result.inserted_id})
        user['_id'] = str(user['_id'])
        
        return jsonify({'success': True, 'user': user})
    except DuplicateKeyError:
        return jsonify({'error': 'Email already exists'}), 400
    except Exception as err:
        return jsonify({'error': str(err)}), 400


@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = list(users_col.find())
        for user in users:
            user['_id'] = str(user['_id'])
        return jsonify(users)
    except Exception as err:
        return jsonify({'error': str(err)}), 500


# PRODUCTS
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = list(products_col.find())
        for product in products:
            product['_id'] = str(product['_id'])
        return jsonify(products)
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        data = request.json
        data['createdAt'] = datetime.now()
        
        result = products_col.insert_one(data)
        product = products_col.find_one({'_id': result.inserted_id})
        product['_id'] = str(product['_id'])
        
        return jsonify({'success': True, 'product': product})
    except Exception as err:
        return jsonify({'error': str(err)}), 400


@app.route('/api/products/<id>', methods=['PUT'])
def update_product(id):
    try:
        data = request.json
        result = products_col.update_one(
            {'_id': ObjectId(id)},
            {'$set': data}
        )
        
        product = products_col.find_one({'_id': ObjectId(id)})
        product['_id'] = str(product['_id'])
        
        return jsonify({'success': True, 'product': product})
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/products/<id>', methods=['DELETE'])
def delete_product(id):
    try:
        products_col.delete_one({'_id': ObjectId(id)})
        return jsonify({'success': True, 'message': 'Product deleted'})
    except Exception as err:
        return jsonify({'error': str(err)}), 500


# ORDERS
@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        orders = list(orders_col.find())
        for order in orders:
            order['_id'] = str(order['_id'])
        return jsonify(orders)
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.json
        data['createdAt'] = datetime.now()
        
        result = orders_col.insert_one(data)
        order = orders_col.find_one({'_id': result.inserted_id})
        order['_id'] = str(order['_id'])
        
        return jsonify({'success': True, 'order': order})
    except Exception as err:
        return jsonify({'error': str(err)}), 400


@app.route('/api/orders/<id>', methods=['PUT'])
def update_order(id):
    try:
        data = request.json
        result = orders_col.update_one(
            {'_id': ObjectId(id)},
            {'$set': data}
        )
        
        order = orders_col.find_one({'_id': ObjectId(id)})
        order['_id'] = str(order['_id'])
        
        return jsonify({'success': True, 'order': order})
    except Exception as err:
        return jsonify({'error': str(err)}), 500


# ─── COLLABORATION REQUESTS ───────────────────────────────────────────────────

@app.route('/api/shops/<user_id>', methods=['GET'])
def get_shops(user_id):
    try:
        shops = list(users_col.find(
            {'_id': {'$ne': ObjectId(user_id)}, 'role': {'$ne': 'admin'}},
            {'password': 0}
        ))
        for shop in shops:
            shop['_id'] = str(shop['_id'])
        return jsonify(shops)
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/collaborations/request', methods=['POST'])
def send_collab_request():
    try:
        data = request.json
        data['status'] = 'pending'
        data['createdAt'] = datetime.now()
        
        result = collaborations_col.insert_one(data)
        collab = collaborations_col.find_one({'_id': result.inserted_id})
        collab['_id'] = str(collab['_id'])
        collab['from'] = str(collab.get('from', ''))
        collab['to'] = str(collab.get('to', ''))
        
        return jsonify({'success': True, 'request': collab})
    except Exception as err:
        return jsonify({'error': str(err)}), 400


@app.route('/api/collaborations/<user_id>', methods=['GET'])
def get_collaborations(user_id):
    try:
        requests_list = list(collaborations_col.find({
            '$or': [
                {'from': ObjectId(user_id)},
                {'to': ObjectId(user_id)}
            ]
        }).sort('createdAt', -1))
        
        for req in requests_list:
            req['_id'] = str(req['_id'])
            req['from'] = str(req.get('from', ''))
            req['to'] = str(req.get('to', ''))
        
        return jsonify(requests_list)
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/collaborations/<request_id>/accept', methods=['PUT'])
def accept_collaboration(request_id):
    try:
        collab = collaborations_col.find_one({'_id': ObjectId(request_id)})
        
        collaborations_col.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {'status': 'accepted'}}
        )
        
        # Increment collaborations count
        users_col.update_one(
            {'_id': collab['from']},
            {'$inc': {'collaborations': 1}}
        )
        users_col.update_one(
            {'_id': collab['to']},
            {'$inc': {'collaborations': 1}}
        )
        
        updated_collab = collaborations_col.find_one({'_id': ObjectId(request_id)})
        updated_collab['_id'] = str(updated_collab['_id'])
        updated_collab['from'] = str(updated_collab.get('from', ''))
        updated_collab['to'] = str(updated_collab.get('to', ''))
        
        return jsonify({'success': True, 'collab': updated_collab})
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/collaborations/<request_id>/reject', methods=['PUT'])
def reject_collaboration(request_id):
    try:
        collaborations_col.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {'status': 'rejected'}}
        )
        
        updated_collab = collaborations_col.find_one({'_id': ObjectId(request_id)})
        updated_collab['_id'] = str(updated_collab['_id'])
        updated_collab['from'] = str(updated_collab.get('from', ''))
        updated_collab['to'] = str(updated_collab.get('to', ''))
        
        return jsonify({'success': True, 'collab': updated_collab})
    except Exception as err:
        return jsonify({'error': str(err)}), 500


# ─── PAYMENT ROUTES (Razorpay) ─────────────────────────────────────────────────

@app.route('/api/payments/create-order', methods=['POST'])
def create_razorpay_order():
    try:
        data = request.json
        amount = data.get('amount')
        currency = data.get('currency', 'INR')
        receipt = data.get('receipt', f'order_{int(datetime.now().timestamp())}')
        
        # This would require razorpay SDK
        # For now, returning mock response
        return jsonify({
            'success': True,
            'order': {
                'id': f'order_{int(datetime.now().timestamp())}',
                'amount': amount * 100,  # Convert to paise
                'currency': currency,
                'receipt': receipt
            }
        })
    except Exception as err:
        return jsonify({'error': str(err)}), 400


@app.route('/api/payments/verify', methods=['POST'])
def verify_payment():
    try:
        data = request.json
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        
        # Verify signature (requires RAZORPAY_KEY_SECRET)
        secret = os.getenv('RAZORPAY_KEY_SECRET', 'test_secret')
        body = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            secret.encode(),
            body.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature == razorpay_signature:
            return jsonify({'success': True, 'message': 'Payment verified successfully'})
        else:
            return jsonify({'success': False, 'message': 'Payment verification failed'}), 400
    except Exception as err:
        return jsonify({'error': str(err)}), 400


# Health check
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})


# Serve frontend (index.html) and static files from project root
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # If the requested path exists as a file, serve it
    full_path = os.path.join(os.getcwd(), path)
    if path and os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory(os.getcwd(), path)

    # Otherwise serve index.html (Single Page App entry)
    index_path = os.path.join(os.getcwd(), 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(os.getcwd(), 'index.html')

    return jsonify({'error': 'index.html not found'}), 404


# Run server
if __name__ == '__main__':
    PORT = os.getenv('PORT', 5000)
    print(f'\n🚀 Server running at http://localhost:{PORT}')
    print(f'📦 MongoDB: {MONGODB_URI}')
    app.run(debug=True, port=PORT)
