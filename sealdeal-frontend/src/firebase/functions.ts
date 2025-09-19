import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig'; // Use relative path

const functions = getFunctions(app, 'asia-south1');

// --- Callable Functions ---

/**
 * Creates a new deal in Firestore.
 */
export const createDeal = httpsCallable<{ dealName: string }, { dealId: string }>(functions, 'createDeal');


/**
 * Starts the comprehensive analysis for a given deal.
 */
export const startComprehensiveAnalysis = httpsCallable<{ dealId: string }, { success: boolean }>(functions, 'startComprehensiveAnalysis');

// Add other function calls like setUserRole, addBenchmarkData etc. here as needed

