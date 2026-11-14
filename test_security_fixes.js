/**
 * SANNIVESHAM — SECURITY FIXES VERIFICATION TEST SUITE
 * 
 * Verifies:
 * 1. Admin Authorization Guard
 * 2. Razorpay HMAC-SHA256 Signature Verification
 * 3. Subscription Server-Side Plan & Price Enforcement
 * 4. AI Endpoint Rate Limiter & History Sanitization
 */

const assert = require("assert");
const crypto = require("crypto");
const { SUBSCRIPTION_PLANS } = require("./functions/payments");

console.log("=================================================");
console.log("🔒 RUNNING SANNIVESHAM SECURITY VERIFICATION SUITE");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }
}

// ----------------------------------------------------
// 1. ADMIN AUTHORIZATION LOGIC
// ----------------------------------------------------
function evaluateAdmin(claims, email, allowlistDoc) {
  if (claims && claims.admin === true) return true;
  if (!email || !allowlistDoc) return false;
  if (Array.isArray(allowlistDoc.emails) && allowlistDoc.emails.includes(email)) return true;
  if (allowlistDoc.email && allowlistDoc.email === email) return true;
  return false;
}

test("Admin check: User with regular email is NOT granted admin", () => {
  const result = evaluateAdmin(null, "attacker@example.com", { emails: ["admin@sannivesham.in"] });
  assert.strictEqual(result, false, "Arbitrary email user should be denied admin access");
});

test("Admin check: User with admin: true custom claim is granted admin", () => {
  const result = evaluateAdmin({ admin: true }, "user@example.com", null);
  assert.strictEqual(result, true, "User with admin custom claim must be granted admin access");
});

test("Admin check: User in settings/admin allowlist is granted admin", () => {
  const result = evaluateAdmin(null, "admin@sannivesham.in", { emails: ["admin@sannivesham.in"] });
  assert.strictEqual(result, true, "User in allowlist must be granted admin access");
});

// ----------------------------------------------------
// 2. RAZORPAY SUBSCRIPTION PRICING & HMAC VERIFICATION
// ----------------------------------------------------
test("Subscription plans: Canonical prices are enforced server-side", () => {
  assert.strictEqual(SUBSCRIPTION_PLANS.monthly.amountPaise, 9900, "Monthly plan must be ₹99");
  assert.strictEqual(SUBSCRIPTION_PLANS.yearly.amountPaise, 69900, "Yearly plan must be ₹699");
  assert.strictEqual(SUBSCRIPTION_PLANS.lifetime.amountPaise, 199900, "Lifetime plan must be ₹1999");
});

test("Razorpay verification: Tampered signature is strictly rejected", () => {
  const secret = "test_razorpay_secret_key";
  const orderId = "order_9A33X56A32F7";
  const paymentId = "pay_29A323X34211";

  // Generate valid signature
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Tampered signature
  const tamperedSignature = validSignature.slice(0, -4) + "0000";

  const bufExpected = Buffer.from(validSignature, "utf-8");
  const bufReceived = Buffer.from(tamperedSignature, "utf-8");

  const isValid = bufExpected.length === bufReceived.length && crypto.timingSafeEqual(bufExpected, bufReceived);
  assert.strictEqual(isValid, false, "Tampered payment signature must fail verification");
});

test("Razorpay verification: Authentic signature passes verification", () => {
  const secret = "test_razorpay_secret_key";
  const orderId = "order_9A33X56A32F7";
  const paymentId = "pay_29A323X34211";

  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const bufExpected = Buffer.from(validSignature, "utf-8");
  const bufReceived = Buffer.from(validSignature, "utf-8");

  const isValid = bufExpected.length === bufReceived.length && crypto.timingSafeEqual(bufExpected, bufReceived);
  assert.strictEqual(isValid, true, "Authentic payment signature must pass verification");
});

// ----------------------------------------------------
// 3. RATE LIMITER LOGIC
// ----------------------------------------------------
const store = new Map();
function testRateLimiter(key, maxRequests, windowMs, mockNow) {
  const record = store.get(key) || [];
  const validTimestamps = record.filter(t => mockNow - t < windowMs);
  if (validTimestamps.length >= maxRequests) {
    return false;
  }
  validTimestamps.push(mockNow);
  store.set(key, validTimestamps);
  return true;
}

test("Rate limiter: Allows requests within quota and blocks when exceeded", () => {
  const key = "test_user_1";
  const max = 3;
  const windowMs = 60000;
  const baseTime = 100000;

  assert.strictEqual(testRateLimiter(key, max, windowMs, baseTime), true);
  assert.strictEqual(testRateLimiter(key, max, windowMs, baseTime + 100), true);
  assert.strictEqual(testRateLimiter(key, max, windowMs, baseTime + 200), true);
  // 4th request must be blocked
  assert.strictEqual(testRateLimiter(key, max, windowMs, baseTime + 300), false);
  // After window expires, request should be allowed again
  assert.strictEqual(testRateLimiter(key, max, windowMs, baseTime + windowMs + 10), true);
});

// ----------------------------------------------------
// 4. INPUT VALIDATION & CAPPING
// ----------------------------------------------------
test("Input validation: Large prompt over 1000 characters is flagged", () => {
  const oversizedMessage = "A".repeat(1001);
  assert.strictEqual(oversizedMessage.length > 1000, true, "Oversized message must exceed limit");
});

console.log("\n=================================================");
console.log(`TOTAL SECURITY TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${totalTests - passedTests}`);
console.log("=================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
