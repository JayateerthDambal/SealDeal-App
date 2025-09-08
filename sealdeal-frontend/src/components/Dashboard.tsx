import { useState, useEffect, useMemo } from 'react';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { ChartBarIcon, ArrowTrendingUpIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FileUpload from './FileUpload';
import AnalysisDisplay from './AnalysisDisplay';
import Breadcrumb from './Breadcrumb';
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
    const [showCreateDeal, setShowCreateDeal] = useState(false);

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
        if (!newDealName.trim()) { 
            setError("Please enter a deal name."); 
            return; 
        }
        setError('');
        try {
            const createDealFunction = httpsCallable(functions, 'createDeal');
            await createDealFunction({ dealName: newDealName.trim() });
            setNewDealName('');
            setShowCreateDeal(false);
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


    const selectedDeal = deals.find(d => d.id === selectedDealId);

    // Portfolio analytics
    const portfolioStats = useMemo(() => {
        const totalDeals = deals.length;
        const analyzedDeals = deals.filter(d => d.status === '4_Analyzed').length;
        const totalDocuments = documents.length;
        
        // Aggregate analysis data across all deals
        // In a real app, you'd fetch analysis data for all deals, but for now we'll use current selectedDeal data
        
        const strongCandidates = analysisData.filter(a => a.investment_memo.investment_recommendation === 'Strong Candidate').length;
        const totalRisks = analysisData.reduce((acc, a) => acc + (a.risk_flags?.length || 0), 0);
        
        return {
            totalDeals,
            analyzedDeals,
            totalDocuments,
            strongCandidates,
            totalRisks,
            analysisRate: totalDeals > 0 ? Math.round((analyzedDeals / totalDeals) * 100) : 0
        };
    }, [deals, documents, analysisData]);

    return (
        <div className="bg-gray-50 min-h-screen">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb Navigation */}
                <Breadcrumb 
                    items={[
                        { label: 'Investment Portfolio', current: !selectedDealId },
                        ...(selectedDealId && selectedDeal ? [{ label: selectedDeal.dealName, current: true }] : [])
                    ]} 
                />
                
                {/* Portfolio Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Deals</p>
                                <p className="text-3xl font-bold text-gray-900">{portfolioStats.totalDeals}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <ChartBarIcon className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">
                                {portfolioStats.analyzedDeals} analyzed ({portfolioStats.analysisRate}%)
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Documents Uploaded</p>
                                <p className="text-3xl font-bold text-gray-900">{portfolioStats.totalDocuments}</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <DocumentTextIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">
                                Ready for analysis
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Strong Candidates</p>
                                <p className="text-3xl font-bold text-green-600">{portfolioStats.strongCandidates}</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">
                                Investment opportunities
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Risk Flags</p>
                                <p className="text-3xl font-bold text-amber-600">{portfolioStats.totalRisks}</p>
                            </div>
                            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">
                                Require attention
                            </span>
                        </div>
                    </div>
                </div>

                {/* Create Deal Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Investment Portfolio</h2>
                            <p className="text-gray-600 mt-1">Manage and analyze your investment opportunities</p>
                        </div>
                        <button
                            onClick={() => setShowCreateDeal(true)}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <ChartBarIcon className="h-5 w-5 mr-2" />
                            New Investment Deal
                        </button>
                    </div>

                    {/* Create Deal Modal/Form */}
                    {showCreateDeal && (
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Deal</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="dealName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Startup Name
                                    </label>
                                    <input
                                        id="dealName"
                                        type="text"
                                        value={newDealName}
                                        onChange={(e) => setNewDealName(e.target.value)}
                                        placeholder="Enter startup name (e.g., TechCorp Inc.)"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                        onKeyPress={(e) => e.key === 'Enter' && handleCreateDeal()}
                                    />
                                </div>
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleCreateDeal}
                                        disabled={!newDealName.trim()}
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Create Deal
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateDeal(false);
                                            setNewDealName('');
                                            setError('');
                                        }}
                                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Deals Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                        </div>
                        <div className="mt-6 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Your Portfolio</h3>
                            <p className="text-gray-600 animate-pulse">Fetching deals and analysis data...</p>
                        </div>
                    </div>
                ) : deals.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="mb-8">
                            <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                                <div className="text-4xl">📊</div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SealDeal</h3>
                            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                                Start your investment analysis journey by creating your first deal
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateDeal(true)}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <ChartBarIcon className="h-5 w-5 mr-2" />
                            Create Your First Deal
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {deals.map(deal => (
                            <div
                                key={deal.id}
                                onClick={() => setSelectedDealId(deal.id)}
                                className={`cursor-pointer bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 border-2 ${
                                    selectedDealId === deal.id 
                                        ? 'border-blue-500 ring-4 ring-blue-100' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{deal.dealName}</h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        deal.status === '1_Uploaded' ? 'bg-yellow-100 text-yellow-800' :
                                        deal.status === '4_Analyzed' ? 'bg-green-100 text-green-800' :
                                        deal.status === '2_Processing' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {deal.status === '1_Uploaded' ? 'Ready for Analysis' :
                                         deal.status === '4_Analyzed' ? 'Analyzed' :
                                         deal.status === '2_Processing' ? 'Processing' : 'New'}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm">
                                    Click to {selectedDealId === deal.id ? 'manage this deal' : 'select and upload files'}
                                </p>
                                {selectedDealId === deal.id && (
                                    <div className="mt-3 flex items-center text-blue-600">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                                        <span className="text-xs font-medium">Currently selected</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Selected Deal Section */}
                {selectedDealId && selectedDeal && (
                    <div className="bg-white rounded-lg shadow-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {selectedDeal.dealName}
                            </h3>
                            <p className="text-gray-600 mt-1">Upload documents and run comprehensive analysis</p>
                        </div>
                        
                        <div className="p-6">
                            <FileUpload dealId={selectedDealId} />
                            
                            {/* Documents and Analysis Section */}
                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">
                                        Uploaded Documents ({documents.length})
                                    </h4>
                                    {documents.length > 0 && (
                                        <button
                                            onClick={handleStartAnalysis}
                                            disabled={isAnalyzing || selectedDeal.status !== '1_Uploaded'}
                                            className={`px-6 py-3 font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                                                selectedDeal.status === '4_Analyzed' 
                                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                                            }`}
                                        >
                                            {isAnalyzing ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>AI Analysis in Progress...</span>
                                                </div>
                                            ) : selectedDeal.status === '4_Analyzed' ? (
                                                '✓ Analysis Complete'
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <ChartBarIcon className="h-5 w-5" />
                                                    <span>Run AI Analysis</span>
                                                </div>
                                            )}
                                        </button>
                                    )}
                                </div>
                                
                                {documents.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                        {documents.map(doc => (
                                            <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-red-500 text-xl mr-3">📄</div>
                                                <span className="text-sm text-gray-700 truncate">{doc.fileName}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-4xl mb-2">📄</div>
                                        <p className="text-gray-600">No documents uploaded yet</p>
                                    </div>
                                )}
                                
                                {selectedDeal.status && selectedDeal.status !== '1_Uploaded' && (
                                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-6">
                                        Analysis has been completed for this deal. View results below.
                                    </div>
                                )}
                            </div>
                            
                            <AnalysisDisplay analysis={analysisData} dealName={selectedDeal.dealName} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

