import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// The 'getFunctions' import was missing from this line
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// TODO: Later turn this to .env
const firebaseConfig = {
  apiKey: "AIzaSyBgVprZ-f_IMuULto8upD7TBdWUwdWKlQc",
  authDomain: "genai-hackathon-aicommanders.firebaseapp.com",
  projectId: "genai-hackathon-aicommanders",
  storageBucket: "genai-hackathon-aicommanders.firebasestorage.app",
  messagingSenderId: "911058000673",
  appId: "1:911058000673:web:51550be8136446bc3bfc60"
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
