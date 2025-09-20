import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '../firebaseConfig'; // Import auth
import { ComparisonData } from '../pages/ComparePage';

const functions = getFunctions(app, 'asia-south1');
const region = 'asia-south1';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;


// --- Standard Functions ---
export const createDeal = httpsCallable<{ dealName: string }, { dealId: string }>(functions, 'createDeal');
export const startComprehensiveAnalysis = httpsCallable<{ dealId: string }, { success: boolean }>(functions, 'startComprehensiveAnalysis');
export const getComparisonData = httpsCallable<{dealIds: string[]}, {data: ComparisonData[]}>(functions, 'getComparisonData');

// --- Chat Agent Function (NEW FETCH IMPLEMENTATION) ---
export const chatWithAgent = async ({ sessionId, message }: { sessionId: string, message: string }): Promise<{ formatted: string, sql: string }> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Authentication is required to chat with the agent.");
    }

    const token = await user.getIdToken();
    // The URL is constructed from your project config and function name.
    // The endpoint is /chat, as defined in your Express app.
    const url = `https://${region}-${projectId}.cloudfunctions.net/chatAgent/chat`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, message })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
};

// --- Admin Functions ---
export const setUserRole = httpsCallable<{ targetUid: string, newRole: string }, { message: string }>(functions, 'setUserRole');
export const addBenchmarkData = httpsCallable<{ industry: string, stage: string, arr: number }>(functions, 'addBenchmarkData');

