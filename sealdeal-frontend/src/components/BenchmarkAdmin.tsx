import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import BigQuerySync from './BigQuerySync';
import { type BenchmarkData } from '../types';

const BenchmarkAdmin: React.FC = () => {
    const [formData, setFormData] = useState<BenchmarkData>({
        industry: 'SaaS',
        stage: 'Seed',
        arr: 0,
        mrr: 0,
        cac: 0,
        ltv: 0,
    });
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'industry' || name === 'stage' ? value : Number(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        
        try {
            const addBenchmarkFunction = httpsCallable(functions, 'addBenchmarkData');
            await addBenchmarkFunction(formData);
            setMessage('Benchmark data added successfully!');
            // Reset form
            setFormData({
                industry: 'SaaS',
                stage: 'Seed', 
                arr: 0,
                mrr: 0,
                cac: 0,
                ltv: 0,
            });
        } catch (error) {
            console.error("Error adding benchmark data:", error);
            setMessage('Failed to add data. See console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h2>
                    <p className="text-gray-600">Manage benchmark data and system settings</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Benchmark Data Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Benchmark Data Point</h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                                    <select 
                                        name="industry" 
                                        value={formData.industry} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="SaaS">SaaS</option>
                                        <option value="FinTech">FinTech</option>
                                        <option value="HealthTech">HealthTech</option>
                                        <option value="DeepTech">DeepTech</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                                    <select 
                                        name="stage" 
                                        value={formData.stage} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Seed">Seed</option>
                                        <option value="Series A">Series A</option>
                                        <option value="Series B">Series B</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ARR (USD)</label>
                                    <input 
                                        type="number" 
                                        name="arr" 
                                        value={formData.arr} 
                                        onChange={handleChange} 
                                        required 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">MRR (USD)</label>
                                    <input 
                                        type="number" 
                                        name="mrr" 
                                        value={formData.mrr} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CAC (USD)</label>
                                    <input 
                                        type="number" 
                                        name="cac" 
                                        value={formData.cac} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">LTV (USD)</label>
                                    <input 
                                        type="number" 
                                        name="ltv" 
                                        value={formData.ltv} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                                    isSubmitting
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Benchmark Data'}
                            </button>
                        </form>
                        
                        {message && (
                            <div className={`mt-4 p-3 rounded-lg ${
                                message.includes('success') 
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {message}
                            </div>
                        )}
                    </div>
                    
                    {/* BigQuery Sync Section */}
                    <div>
                        <BigQuerySync />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BenchmarkAdmin;