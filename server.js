import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Server as IOServer } from 'socket.io';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_prod';

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: '*' }
});

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bulkbuy')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ─── SCHEMAS ───────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  ownerName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  shopName: String,
  location: String,
  category: String,
  totalSavings: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  collaborations: { type: Number, default: 0 },
  role: { type: String, default: 'owner' },
  joinDate: String,
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  bulkPrice: Number,
  bulkThreshold: Number,
  supplier: String,
  rating: Number,
  reviews: Number,
  image: String,
  stock: Number,
  unit: String,
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  product: String,
  qty: Number,
  status: String,
  shops: [String],
  saving: Number,
  date: String,
  totalAmount: Number,
  shopBreakdown: Array,
  createdAt: { type: Date, default: Date.now }
});

const collaborationSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromShop: String,
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toShop: String,
  productName: String,
  poolTarget: Number,
  status: { type: String, default: 'pending' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Collaboration = mongoose.model('Collaboration', collaborationSchema);
// Messages for real-time chat
const messageSchema = new mongoose.Schema({
  threadId: String, // unique conversation id
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// Users
// Register - hashes password and returns JWT
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password, ownerName, shopName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ ...req.body, password: hashed, joinDate: new Date().toISOString() });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: { id: newUser._id, email: newUser.email, ownerName, shopName }, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login - verifies password and returns JWT
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: { id: user._id, email: user.email, ownerName: user.ownerName, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth middleware
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ success: true, order: newOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COLLABORATION REQUESTS ───────────────────────────────────────────────────

// Get all shops (excluding current user)
app.get('/api/shops/:userId', async (req, res) => {
  try {
    const shops = await User.find({ _id: { $ne: req.params.userId }, role: { $ne: 'admin' } }).select('-password');
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send collaboration request
app.post('/api/collaborations/request', async (req, res) => {
  try {
    const { fromId, toId, fromShop, toShop, productName, poolTarget, message } = req.body;
    const request = new Collaboration({
      from: fromId,
      to: toId,
      fromShop,
      toShop,
      productName,
      poolTarget,
      message,
      status: 'pending'
    });
    await request.save();
    res.json({ success: true, request });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get collaboration requests for a user
app.get('/api/collaborations/:userId', async (req, res) => {
  try {
    const requests = await Collaboration.find({
      $or: [{ from: req.params.userId }, { to: req.params.userId }]
    }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept collaboration request
app.put('/api/collaborations/:requestId/accept', async (req, res) => {
  try {
    const collab = await Collaboration.findByIdAndUpdate(
      req.params.requestId,
      { status: 'accepted' },
      { new: true }
    );
    // Increment collaborations count for both users
    await User.findByIdAndUpdate(collab.from, { $inc: { collaborations: 1 } });
    await User.findByIdAndUpdate(collab.to, { $inc: { collaborations: 1 } });
    res.json({ success: true, collab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject collaboration request
app.put('/api/collaborations/:requestId/reject', async (req, res) => {
  try {
    const collab = await Collaboration.findByIdAndUpdate(
      req.params.requestId,
      { status: 'rejected' },
      { new: true }
    );
    res.json({ success: true, collab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PAYMENT ROUTES (Razorpay) ─────────────────────────────────────────────────

// Create Razorpay Order
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || 'order_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify Payment
app.post('/api/payments/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update order status if an order with this receipt exists
      (async () => {
        try {
          // Try to find an order by receipt/order id in Orders collection
          const updated = await Order.findOneAndUpdate({ 'razorpayOrderId': razorpay_order_id }, { $set: { status: 'paid', razorpayPaymentId: razorpay_payment_id } }, { new: true });
          if (updated) {
            // notify admin clients via socket
            io.to('admin').emit('payment:received', { orderId: updated._id, totalAmount: updated.totalAmount });
          }
        } catch (e) {
          console.error('Error updating order after payment:', e.message);
        }
      })();

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Chat: fetch messages for a thread
app.get('/api/chat/messages/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const msgs = await Message.find({ threadId }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat threads for a user: returns threadId, participants, lastMessage, unreadCount
app.get('/api/chat/threads/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const threads = await Message.aggregate([
      { $match: { $or: [ { from: mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : userId }, { to: mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : userId } ] } },
      { $group: { _id: '$threadId', lastMessage: { $last: '$$ROOT' }, unread: { $sum: { $cond: [ { $and: [ { $eq: ['$threadId', '$threadId'] }, { $eq: ['$to', mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : userId ] }, { $eq: ['$read', false] } ] }, 1, 0 ] } } } },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]).allowDiskUse(true);
    res.json(threads.map(t => ({ threadId: t._id, lastMessage: t.lastMessage, unreadCount: t.unread || 0 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages in a thread as read for a specific user
app.put('/api/chat/messages/:threadId/read', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { userId } = req.body;
    const filter = { threadId, to: mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : userId, read: false };
    const upd = await Message.updateMany(filter, { $set: { read: true } });
    // notify thread participants
    io.to(threadId).emit('read', { threadId, userId });
    res.json({ success: true, modified: upd.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a chat message (from frontend fallback)
app.post('/api/chat/messages', async (req, res) => {
  try {
    const { threadId = 'bulk-order-group', from, to, text, userId, sender } = req.body;
    const msg = new Message({ threadId, from: userId, to, text, createdAt: new Date(), read: false });
    await msg.save();
    // emit to thread via socket
    io.to(threadId).emit('message', msg);
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO handlers
io.on('connection', (socket) => {
  // join user to a room (thread) or admin room
  socket.on('join', ({ threadId, userId, role }) => {
    if (role === 'admin') socket.join('admin');
    if (threadId) socket.join(threadId);
  });

  socket.on('message', async (data) => {
    // data: { threadId, from, to, text }
    try {
      const msg = new Message({ threadId: data.threadId, from: data.from, to: data.to, text: data.text });
      await msg.save();
      io.to(data.threadId).emit('message', msg);
    } catch (e) {
      console.error('Error saving message:', e.message);
    }
  });

  socket.on('typing', ({ threadId, userId }) => {
    socket.to(threadId).emit('typing', { userId });
  });

  socket.on('markRead', async ({ threadId, userId }) => {
    try {
      await Message.updateMany({ threadId, to: userId, read: false }, { $set: { read: true } });
      io.to(threadId).emit('read', { threadId, userId });
    } catch (e) {
      console.error('Error marking messages read:', e.message);
    }
  });
});

// Start HTTP server (with Socket.IO)
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/bulkbuy'}`);
});
