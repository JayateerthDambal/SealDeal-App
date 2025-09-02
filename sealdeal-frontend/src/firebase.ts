import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// The 'getFunctions' import was missing from this line
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
// IMPORTANT: It's better to use environment variables for this in a real app
const firebaseConfig = {
  apiKey: "AIzaSyBP0MYTBNJXgQaDenApYczx_TbaQr41k4E",
  authDomain: "sunlit-setup-470516-q3.firebaseapp.com",
  projectId: "sunlit-setup-470516-q3",
  storageBucket: "sunlit-setup-470516-q3.firebasestorage.app",
  messagingSenderId: "318231552684",
  appId: "1:318231552684:web:4042d38684c859e5313509"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-south1');

// Connect to emulators if running locally (in development)
if (window.location.hostname === "localhost") {
  console.log("Development mode: Connecting to local Firebase emulators.");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectStorageEmulator(storage, "localhost", 9199);
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
}
