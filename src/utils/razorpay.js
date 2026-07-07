// Razorpay Payment Integration Helper
export const initRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const createPaymentOrder = async (amount) => {
  try {
    const res = await fetch(`${API_BASE}/api/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: "order_" + Date.now(),
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error creating order:", err);
    throw err;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const res = await fetch(`${API_BASE}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    return await res.json();
  } catch (err) {
    console.error("Error verifying payment:", err);
    throw err;
  }
};

export const openRazorpayCheckout = async (amount, userEmail, userName, callback) => {
  // DEMO MODE: Skip actual Razorpay & simulate successful payment
  // In production, use real Razorpay keys from environment
  
  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
    
    // Return mock payment data
    const mockPaymentId = `pay_${Math.random().toString(36).substr(2, 9)}`;
    callback(true, mockPaymentId);
  } catch (err) {
    callback(false, err.message);
  }
};
