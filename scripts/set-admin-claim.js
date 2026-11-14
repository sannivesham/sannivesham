/**
 * SANNIVESHAM — SERVER-SIDE ADMIN CLAIM MANAGER
 * 
 * Usage:
 *   node scripts/set-admin-claim.js <user-email-or-uid> [--revoke]
 * 
 * Prerequisites:
 *   Ensure GOOGLE_APPLICATION_CREDENTIALS points to your Firebase Service Account JSON,
 *   or place `serviceAccountKey.json` in the project root (it is gitignored).
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Look for service account key
const serviceKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, "..", "serviceAccountKey.json");

if (fs.existsSync(serviceKeyPath)) {
  const serviceAccount = require(path.resolve(serviceKeyPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // Attempt default application credentials
  try {
    admin.initializeApp();
  } catch (e) {
    console.error("❌ Service account key not found!");
    console.error("Please set GOOGLE_APPLICATION_CREDENTIALS or put serviceAccountKey.json in the project root.");
    process.exit(1);
  }
}

const target = process.argv[2];
const isRevoke = process.argv.includes("--revoke");

if (!target) {
  console.log("Usage: node scripts/set-admin-claim.js <email-or-uid> [--revoke]");
  process.exit(1);
}

async function run() {
  let userRecord;
  try {
    if (target.includes("@")) {
      userRecord = await admin.auth().getUserByEmail(target);
    } else {
      userRecord = await admin.auth().getUser(target);
    }
  } catch (err) {
    console.error(`❌ User not found (${target}):`, err.message);
    process.exit(1);
  }

  const newClaims = isRevoke ? { admin: false } : { admin: true };
  await admin.auth().setCustomUserClaims(userRecord.uid, newClaims);

  console.log(`✅ Success! Custom claim { admin: ${!isRevoke} } set for:`);
  console.log(`   UID:   ${userRecord.uid}`);
  console.log(`   Email: ${userRecord.email || "No email"}`);

  // Also synchronize with settings/admin Firestore allowlist
  try {
    const db = admin.firestore();
    const adminDocRef = db.collection("settings").doc("admin");
    const docSnap = await adminDocRef.get();
    let emails = [];
    if (docSnap.exists) {
      emails = docSnap.data().emails || (docSnap.data().email ? [docSnap.data().email] : []);
    }

    if (!isRevoke && userRecord.email) {
      if (!emails.includes(userRecord.email)) {
        emails.push(userRecord.email);
        await adminDocRef.set({ emails, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        console.log(`✅ Also added ${userRecord.email} to Firestore settings/admin allowlist.`);
      }
    } else if (isRevoke && userRecord.email) {
      emails = emails.filter(e => e !== userRecord.email);
      await adminDocRef.set({ emails, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      console.log(`✅ Removed ${userRecord.email} from Firestore settings/admin allowlist.`);
    }
  } catch (fsErr) {
    console.warn("⚠️ Could not update Firestore settings/admin doc (check Firestore permissions):", fsErr.message);
  }

  console.log("\nNote: The user must sign out and sign in again (or refresh their ID token) for the new claim to take effect in the browser.");
  process.exit(0);
}

run();
