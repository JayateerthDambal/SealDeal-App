import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { ArrowPathIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const BigQuerySync: React.FC = () => {
    const [isBackfilling, setIsBackfilling] = useState(false);
    const [backfillResult, setBackfillResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleBackfillToBigQuery = async () => {
        setError('');
        setIsBackfilling(true);
        setBackfillResult(null);
        
        try {
            const backfillFunction = httpsCallable(functions, 'backfillAnalyticsToBigQuery');
            const result = await backfillFunction({});
            
            setBackfillResult(result.data);
            console.log('BigQuery backfill result:', result.data);
        } catch (error) {
            console.error('Error during BigQuery backfill:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsBackfilling(false);
        }
    };

    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const handleTestAnalytics = async () => {
        setError('');
        setIsTesting(true);
        setTestResult(null);
        
        try {
            const testFunction = httpsCallable(functions, 'getAnalyticsForBigQuery');
            const result = await testFunction({ limit: 10 });
            
            setTestResult(result.data);
            console.log('Analytics test result:', result.data);
        } catch (error) {
            console.error('Error testing analytics:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">BigQuery Synchronization</h3>
                <p className="text-gray-600 text-sm">
                    Manage Firestore to BigQuery data synchronization for analytics and reporting.
                </p>
            </div>

            <div className="space-y-6">
                {/* Backfill Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Backfill Existing Data</h4>
                    <p className="text-gray-600 text-sm mb-4">
                        This will process all existing analysis data and create BigQuery-compatible records in the 'analytics' collection.
                    </p>
                    
                    <button
                        onClick={handleBackfillToBigQuery}
                        disabled={isBackfilling}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isBackfilling
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isBackfilling ? (
                            <>
                                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                                Backfill to BigQuery
                            </>
                        )}
                    </button>

                    {backfillResult && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-green-800 text-sm font-medium">Backfill Completed Successfully</span>
                            </div>
                            <p className="text-green-700 text-sm mt-1">
                                Processed {backfillResult.processedCount} analysis documents.
                            </p>
                        </div>
                    )}
                </div>

                {/* Test Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Test Analytics Access</h4>
                    <p className="text-gray-600 text-sm mb-4">
                        Test if the analytics data is properly structured and accessible for BigQuery export.
                    </p>
                    
                    <button
                        onClick={handleTestAnalytics}
                        disabled={isTesting}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isTesting
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {isTesting ? (
                            <>
                                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Test Analytics Data
                            </>
                        )}
                    </button>

                    {testResult && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center mb-2">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-green-800 text-sm font-medium">Test Successful</span>
                            </div>
                            <p className="text-green-700 text-sm">
                                Found {testResult.count} analytics records. Data structure is BigQuery-compatible.
                            </p>
                            {testResult.analytics && testResult.analytics.length > 0 && (
                                <div className="mt-2 text-xs text-green-600">
                                    <strong>Sample fields:</strong> {Object.keys(testResult.analytics[0]).slice(0, 8).join(', ')}...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                            <span className="text-red-800 text-sm font-medium">Error</span>
                        </div>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                )}

                {/* BigQuery Setup Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-blue-900 mb-2">BigQuery Setup Instructions</h4>
                    <div className="text-blue-800 text-sm space-y-2">
                        <p><strong>1.</strong> Enable the Firebase extension "Export Collections to BigQuery"</p>
                        <p><strong>2.</strong> Configure the extension to export the "analytics" collection</p>
                        <p><strong>3.</strong> The flattened data structure will be automatically synced to BigQuery</p>
                        <p><strong>4.</strong> Use BigQuery SQL to query your investment analytics data</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigQuerySync;