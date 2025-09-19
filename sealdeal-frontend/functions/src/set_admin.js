// --- This script is used to manually set the first admin user ---

// 1. Import the Firebase Admin SDK
import admin from "firebase-admin";

// 2. Import your service account key using ES Module syntax
// IMPORTANT: You must download this file from your Firebase Project Settings.
// Go to Project Settings -> Service accounts -> Generate new private key
import serviceAccount from "./firebaseauthsakey.json" assert { type: "json" };

// --- CONFIGURATION ---
// IMPORTANT: Paste the UID of the user you want to make an admin here.
// You can find the UID in the Firebase Emulator UI -> Authentication tab.
const uidToMakeAdmin = "1nbEnNNFuTabkCjmEUjNkQfgsds2";

// --- SCRIPT LOGIC ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  admin.auth().setCustomUserClaims(uidToMakeAdmin, { role: "admin" })
    .then(() => {
      console.log(`✅ Success! User ${uidToMakeAdmin} has been made an admin.`);
      console.log("You can now log in as this user to manage other user roles in the app.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error setting custom claims:", error);
      process.exit(1);
    });
} catch (error) {
    // CORRECTED: Removed the TypeScript-specific 'as Error' type assertion.
    // The 'message' property can be accessed directly on the error object.
    console.error("❌ Initialization Error:", error.message);
    console.log("--------------------------------------------------------------------");
    console.log("❗️ Common Fixes:");
    console.log("1. Make sure the path to your 'firebaseauthsakey.json' is correct.");
    console.log("2. Ensure the JSON file was downloaded correctly from Firebase.");
    console.log("--------------------------------------------------------------------");
    process.exit(1);
}

