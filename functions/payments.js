/**
 * SANNIVESHAM STREAM — SECURE SERVER-SIDE SUBSCRIPTION & RAZORPAY VERIFICATION
 * 
 * 1. Server-defined canonical pricing (client cannot tamper with price)
 * 2. Cryptographic HMAC-SHA256 signature verification for all payments
 * 3. Atomic writes to `subscribers` collection via Firebase Admin SDK
 * 4. Token-based authentication using Firebase ID token
 */

const crypto = require("crypto");
let Razorpay;
try {
  Razorpay = require("razorpay");
} catch (e) {
  // If razorpay is not yet installed in local testing, fallback gracefully
}

// Canonical subscription plans and server-authoritative prices
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: "monthly",
    name: "Monthly Plan",
    amountPaise: 9900, // ₹99
    durationDays: 30
  },
  yearly: {
    id: "yearly",
    name: "Yearly Plan",
    amountPaise: 69900, // ₹699
    durationDays: 365
  },
  lifetime: {
    id: "lifetime",
    name: "Lifetime Plan",
    amountPaise: 199900, // ₹1999
    durationDays: 36500 // ~100 years
  }
};

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  return { keyId, keySecret };
}

/**
 * Create a verified Razorpay order with server-enforced pricing
 */
async function handleCreateOrder(req, res, db, admin) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { planId } = req.body || {};
    if (!planId || !SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({ error: "Invalid subscription plan selected" });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    const { keyId, keySecret } = getRazorpayConfig();

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: "Payment gateway configuration is missing on the server" });
    }

    if (!Razorpay) {
      Razorpay = require("razorpay");
    }

    const rzpInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const receipt = `sub_${uid.slice(0, 8)}_${Date.now()}`;
    const order = await rzpInstance.orders.create({
      amount: plan.amountPaise,
      currency: "INR",
      receipt: receipt.slice(0, 40),
      notes: {
        uid: uid,
        planId: planId,
        userEmail: decodedToken.email || ""
      }
    });

    return res.status(200).json({
      orderId: order.id,
      amount: plan.amountPaise,
      currency: "INR",
      keyId: keyId,
      planId: planId
    });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ error: "Failed to create subscription order" });
  }
}

/**
 * Verify Razorpay payment signature cryptographically and activate subscription
 */
async function handleVerifyPayment(req, res, db, admin) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return res.status(400).json({ error: "Missing required payment verification parameters" });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan identifier" });
    }

    const { keySecret } = getRazorpayConfig();
    if (!keySecret) {
      return res.status(500).json({ error: "Payment gateway secret is missing on server" });
    }

    // Verify HMAC-SHA256 signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf-8");

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      console.warn(`Payment signature mismatch for UID ${uid}. Possible tampering detected.`);
      return res.status(400).json({ error: "Invalid payment signature. Verification failed." });
    }

    // Calculate expiry date
    const now = new Date();
    const expiryDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Write to Firestore securely via Admin SDK
    await db.collection("subscribers").doc(uid).set({
      uid: uid,
      name: decodedToken.name || decodedToken.email || "Subscriber",
      email: decodedToken.email || "",
      plan: planId,
      amount: plan.amountPaise / 100,
      active: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiryDate.toISOString()
    }, { merge: true });

    return res.status(200).json({
      success: true,
      message: "Subscription verified and activated successfully",
      expiresAt: expiryDate.toISOString()
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({ error: "Payment verification failed" });
  }
}

module.exports = {
  SUBSCRIPTION_PLANS,
  handleCreateOrder,
  handleVerifyPayment
};
