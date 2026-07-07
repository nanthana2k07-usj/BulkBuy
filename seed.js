import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bulkbuy')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

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

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// ─── DEMO DATA ─────────────────────────────────────────────────────────────────

const demoUsers = [
  { id: 1, ownerName: "Rajesh Kumar", email: "rajesh@shop.com", password: "pass123", phone: "9876543210", shopName: "Rajesh General Store", location: "MG Road, Pune", category: "Grocery", totalSavings: 4200, orders: 12, collaborations: 5, role: "owner", joinDate: "Jan 2024" },
  { id: 2, ownerName: "Priya Sharma", email: "priya@shop.com", password: "pass123", phone: "9812345678", shopName: "Priya Mart", location: "FC Road, Pune", category: "Grocery", totalSavings: 2800, orders: 8, collaborations: 3, role: "owner", joinDate: "Feb 2024" },
  { id: 3, ownerName: "Amit Patel", email: "amit@shop.com", password: "pass123", phone: "9823456789", shopName: "Amit Electronics", location: "Kothrud, Pune", category: "Electronics", totalSavings: 6100, orders: 15, collaborations: 7, role: "owner", joinDate: "Dec 2023" },
  { id: 99, ownerName: "Admin", email: "admin@bulkbuy.com", password: "admin123", phone: "9999999999", shopName: "BulkBuy Admin", location: "HQ", category: "All", totalSavings: 0, orders: 0, collaborations: 0, role: "admin", joinDate: "Jan 2024" },
];

const demoProducts = [
  { name: "Premium Basmati Rice (50kg)", category: "Grocery", price: 2800, bulkPrice: 2200, bulkThreshold: 500, supplier: "AgriSupply Co.", rating: 4.7, reviews: 128, image: "https://images.unsplash.com/photo-1586080872614-108e05cdd0ec?w=400&h=300&fit=crop", stock: 5000, unit: "kg" },
  { name: "Refined Sunflower Oil (15L)", category: "Grocery", price: 1650, bulkPrice: 1300, bulkThreshold: 300, supplier: "PureOil Ltd.", rating: 4.5, reviews: 94, image: "https://images.unsplash.com/photo-1474693285529-338265e6e74c?w=400&h=300&fit=crop", stock: 3000, unit: "L" },
  { name: "Cotton T-Shirts Bundle (50pcs)", category: "Clothes", price: 4500, bulkPrice: 3200, bulkThreshold: 200, supplier: "TextilePro", rating: 4.3, reviews: 67, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop", stock: 2000, unit: "pcs" },
  { name: "A4 Paper Reams (10 packs)", category: "Stationery", price: 850, bulkPrice: 620, bulkThreshold: 100, supplier: "PaperWorld", rating: 4.6, reviews: 201, image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=300&fit=crop", stock: 10000, unit: "packs" },
  { name: "LED Bulbs Pack (50pcs)", category: "Electronics", price: 3200, bulkPrice: 2400, bulkThreshold: 250, supplier: "LightTech", rating: 4.4, reviews: 88, image: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=300&fit=crop", stock: 4000, unit: "pcs" },
  { name: "Face Cream Wholesale (100pcs)", category: "Cosmetics", price: 6800, bulkPrice: 5100, bulkThreshold: 400, supplier: "GlowCo", rating: 4.8, reviews: 156, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop", stock: 2000, unit: "pcs" },
  { name: "Wheat Flour (25kg)", category: "Grocery", price: 950, bulkPrice: 720, bulkThreshold: 400, supplier: "FreshMill", rating: 4.6, reviews: 310, image: "https://images.unsplash.com/photo-1599599810694-200de7f57cfd?w=400&h=300&fit=crop", stock: 8000, unit: "kg" },
  { name: "Sugar (50kg)", category: "Grocery", price: 2200, bulkPrice: 1750, bulkThreshold: 600, supplier: "SweetFarm", rating: 4.4, reviews: 190, image: "https://images.unsplash.com/photo-1599599810694-200de7f57cfd?w=400&h=300&fit=crop", stock: 6000, unit: "kg" },
  { name: "Notebook Bundle (100pcs)", category: "Stationery", price: 3200, bulkPrice: 2300, bulkThreshold: 200, supplier: "WriteRight", rating: 4.5, reviews: 142, image: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=300&fit=crop", stock: 5000, unit: "pcs" },
  { name: "Mobile Chargers (20pcs)", category: "Electronics", price: 2800, bulkPrice: 1900, bulkThreshold: 150, supplier: "TechHub", rating: 4.2, reviews: 76, image: "https://images.unsplash.com/photo-1591290621749-186ae304deae?w=400&h=300&fit=crop", stock: 3000, unit: "pcs" },
  { name: "Shampoo Wholesale (200ml×50)", category: "Cosmetics", price: 4500, bulkPrice: 3400, bulkThreshold: 300, supplier: "CareMore", rating: 4.6, reviews: 112, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop", stock: 4000, unit: "pcs" },
  { name: "Denim Jeans Bundle (30pcs)", category: "Clothes", price: 9000, bulkPrice: 6500, bulkThreshold: 150, supplier: "FashionBulk", rating: 4.3, reviews: 58, image: "https://images.unsplash.com/photo-1505503693641-c55953c938d1?w=400&h=300&fit=crop", stock: 1500, unit: "pcs" },
];

// ─── SEED DATABASE (optional) ─────────────────────────────────────────────────
// This script will seed demo data only when SEED_DB=true is set in the environment.
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Insert demo data
    await User.insertMany(demoUsers);
    console.log('Users inserted:', demoUsers.length);

    await Product.insertMany(demoProducts);
    console.log('Products inserted:', demoProducts.length);

    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
}

if (process.env.SEED_DB === 'true') {
  seedDatabase();
} else {
  console.log('SEED_DB not set. Skipping database seeding.');
}
