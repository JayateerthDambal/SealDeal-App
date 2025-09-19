import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// TODO: Later turn this to .env
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
export const googleProvider = new GoogleAuthProvider();
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

// Export the app instance itself to fix the error
export { app };