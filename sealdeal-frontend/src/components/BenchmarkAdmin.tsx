import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
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
            const addBenchmarkDataFunction = httpsCallable(functions, 'addBenchmarkData');
            const result = await addBenchmarkDataFunction(formData);
            setMessage('Successfully added benchmark data!');
            // Reset form
            setFormData({ industry: 'SaaS', stage: 'Seed', arr: 0, mrr: 0, cac: 0, ltv: 0 });
            console.log(result.data);
        } catch (error) {
            console.error("Error adding benchmark data:", error);
            setMessage('Failed to add data. See console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ background: '#f0f5ff', padding: '2rem', borderRadius: '8px', marginTop: '2rem' }}>
            <h3>Add New Benchmark Data Point</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label>Industry: </label>
                    <select name="industry" value={formData.industry} onChange={handleChange}>
                        <option value="SaaS">SaaS</option>
                        <option value="FinTech">FinTech</option>
                        <option value="HealthTech">HealthTech</option>
                        <option value="DeepTech">DeepTech</option>
                    </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label>Stage: </label>
                    <select name="stage" value={formData.stage} onChange={handleChange}>
                        <option value="Seed">Seed</option>
                        <option value="Series A">Series A</option>
                        <option value="Series B">Series B</option>
                    </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label>ARR (USD): </label>
                    <input type="number" name="arr" value={formData.arr} onChange={handleChange} required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label>MRR (USD): </label>
                    <input type="number" name="mrr" value={formData.mrr} onChange={handleChange} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label>CAC (USD): </label>
                    <input type="number" name="cac" value={formData.cac} onChange={handleChange} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label>LTV (USD): </label>
                    <input type="number" name="ltv" value={formData.ltv} onChange={handleChange} />
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Benchmark Data'}
                </button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default BenchmarkAdmin;
