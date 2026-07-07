# MongoDB Configuration

## Local MongoDB Setup

### 1. Install MongoDB Community Edition

**Windows:**
- Download: https://www.mongodb.com/try/download/community
- Run installer and follow setup
- Default location: `C:\Program Files\MongoDB\Server\VERSION\`

### 2. Start MongoDB Service

**Windows 10/11:**
```bash
net start MongoDB
```

Or use MongoDB Compass:
- Download: https://www.mongodb.com/products/tools/compass
- Visual GUI for managing databases

### 3. Verify Connection

```bash
mongosh  # Connect to MongoDB shell
db.version()  # Check version
```

## Environment Setup

Create `.env` file in project root:
```
MONGODB_URI=mongodb://localhost:27017/bulkbuy
PORT=5000
NODE_ENV=development
```

## Run Application

### Option 1: Dev Mode (Both Frontend + Backend)
```bash
npm run dev-full
```
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Option 2: Backend Only
```bash
npm run server
```

### Option 3: Frontend Only
```bash
npm run dev
```

## Database Operations

**Create Demo Data:**
```bash
mongosh
use bulkbuy
db.users.insertOne({ ownerName: "Rajesh Kumar", email: "rajesh@shop.com", password: "pass123", role: "owner" })
```

## Troubleshooting

- **"Cannot connect to MongoDB"**: Ensure MongoDB service is running
- **"Port 5000 in use"**: Change PORT in `.env` file
- **"module not found"**: Run `npm install` to install dependencies

---

Next, we'll update the React app to use the backend API instead of in-memory data.
