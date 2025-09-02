import { useState, useEffect } from 'react';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import FileUpload from './FileUpload';
import AnalysisDisplay from './AnalysisDisplay';
// CORRECT: Import all shared types from the central types.ts file.
import { type Deal, type DealDocument, type AnalysisData } from '../types';

const Dashboard = () => {
    const [newDealName, setNewDealName] = useState('');
    const [deals, setDeals] = useState<Deal[]>([]);
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<DealDocument[]>([]);
    const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Effect for fetching deals
    useEffect(() => {
        if (auth.currentUser) {
            const q = query(collection(db, "deals"), where("ownerId", "==", auth.currentUser.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                // FIX: Add explicit types to the map function to make the import necessary.
                const dealsData: Deal[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Deal));
                setDeals(dealsData);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [auth.currentUser]);

    // Effect for fetching documents and analysis for the selected deal
    useEffect(() => {
        if (selectedDealId) {
            const docsQuery = query(collection(db, "deals", selectedDealId, "documents"));
            const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
                // FIX: Add explicit types to the map function.
                const docsData: DealDocument[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as DealDocument));
                setDocuments(docsData);
            });

            const analysisQuery = query(collection(db, "deals", selectedDealId, "analysis"), orderBy("analyzedAt", "desc"));
            const unsubAnalysis = onSnapshot(analysisQuery, (snapshot) => {
                const analyses: AnalysisData[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as AnalysisData));
                setAnalysisData(analyses);
            });

            return () => {
                unsubDocs();
                unsubAnalysis();
            };
        } else {
            setDocuments([]);
            setAnalysisData([]);
        }
    }, [selectedDealId]);


    const handleCreateDeal = async () => {
        if (!newDealName) { setError("Please enter a deal name."); return; }
        setError('');
        try {
            const createDealFunction = httpsCallable(functions, 'createDeal');
            await createDealFunction({ dealName: newDealName });
            setNewDealName('');
        } catch (error) {
            console.error("Error calling createDeal function:", error);
            setError("Failed to create deal.");
        }
    };

    const handleStartAnalysis = async () => {
        if (!selectedDealId) return;
        setError('');
        setIsAnalyzing(true);
        try {
            const startAnalysisFunction = httpsCallable(functions, 'startComprehensiveAnalysis');
            await startAnalysisFunction({ dealId: selectedDealId });
        } catch (error) {
            console.error("Error starting analysis:", error);
            setError("Failed to start analysis. See console for details.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleLogout = () => {
        signOut(auth);
    };

    const selectedDeal = deals.find(d => d.id === selectedDealId);

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1>Dashboard</h1>
            <p>User: {auth.currentUser?.email}</p>
            <button onClick={handleLogout}>Logout</button>
            <hr />
            <div>
                <h2>Create a New Deal</h2>
                <input
                    type="text"
                    value={newDealName}
                    onChange={(e) => setNewDealName(e.target.value)}
                    placeholder="Enter Startup Name"
                />
                <button onClick={handleCreateDeal}>Create Deal</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
            <hr />
            <div>
                <h2>Your Deals</h2>
                {loading && <p>Loading deals...</p>}
                <ul>
                    {deals.map(deal => (
                        <li key={deal.id} onClick={() => setSelectedDealId(deal.id)} style={{ cursor: 'pointer', fontWeight: selectedDealId === deal.id ? 'bold' : 'normal', padding: '0.5rem' }}>
                            {deal.dealName} (Status: {deal.status})
                        </li>
                    ))}
                </ul>
            </div>
            <hr />
            {selectedDealId && (
                <div>
                    <h3>Selected Deal: {selectedDeal?.dealName}</h3>
                    <FileUpload dealId={selectedDealId} />
                    <div style={{ marginTop: '1rem' }}>
                        <h4>Uploaded Documents:</h4>
                        {documents.length > 0 ? (
                            <ul>{documents.map(doc => <li key={doc.id}>{doc.fileName}</li>)}</ul>
                        ) : (
                            <p>No documents uploaded for this deal yet.</p>
                        )}
                        <button onClick={handleStartAnalysis} disabled={documents.length === 0 || isAnalyzing || selectedDeal?.status !== '1_Uploaded'}>
                            {isAnalyzing ? "Analyzing..." : "Analyze All Documents"}
                        </button>
                         {selectedDeal?.status && selectedDeal.status !== '1_Uploaded' && <p style={{fontSize: '0.8rem', color: '#666'}}>Analysis has already been run for this deal.</p>}
                    </div>
                    {/* This is now guaranteed to work because both components import the same type definition. */}
                    <AnalysisDisplay analysis={analysisData} />
                </div>
            )}
        </div>
    );
};

export default Dashboard;

