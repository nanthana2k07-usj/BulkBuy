# Razorpay Payment Integration Setup

## 🚀 Getting Started

### 1. Create Razorpay Account
- Go to https://razorpay.com
- Sign up for free (Test mode available)
- Go to Settings → API Keys
- Copy your **Key ID** and **Key Secret**

### 2. Update .env File
Add your Razorpay credentials to `.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

### 3. Backend Setup
Your server already has:
- ✅ `POST /api/payments/create-order` - Creates Razorpay order
- ✅ `POST /api/payments/verify` - Verifies payment signature

### 4. Frontend Setup
Payment helper is ready in `src/utils/razorpay.js`:
```javascript
import { openRazorpayCheckout } from '../utils/razorpay';

// Call when user clicks "Pay"
openRazorpayCheckout(
  amount,          // Total amount in ₹
  userEmail,       // User's email
  userName,        // User's name
  (success, data) => {
    if (success) {
      console.log("Payment successful:", data);
    } else {
      console.error("Payment failed:", data);
    }
  }
);
```

## 💳 Test Cards (Razorpay Test Mode)

**Successful Payment:**
- Card: 4111 1111 1111 1111
- Expiry: Any future date (MM/YY)
- CVV: Any 3 digits

**Failed Payment:**
- Card: 4000 0000 0000 0002
- Expiry: Any future date
- CVV: Any 3 digits

## 📱 Integration Example

In your PaymentScreen component:

```javascript
import { openRazorpayCheckout } from '../utils/razorpay';

const handlePayment = () => {
  const totalAmount = cartTotal;
  
  openRazorpayCheckout(
    totalAmount,
    currentUser.email,
    currentUser.ownerName,
    (success, paymentId) => {
      if (success) {
        showToast("Payment successful! Order confirmed.");
        // Save order to database
        // Clear cart
      } else {
        showToast("Payment failed. Please try again.", "error");
      }
    }
  );
};
```

## 🔄 Production Setup

When going live:
1. Upgrade from Test mode to Live mode in Razorpay dashboard
2. Update .env with LIVE key and secret
3. Remove test card numbers from documentation
4. Enable webhook for additional security

## 📊 Monitor Payments

Go to Razorpay Dashboard → Payments to see:
- All transactions
- Payment status
- Customer details
- Refund options

---

**That's it!** Your app now accepts payments via Razorpay. 💰

