import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { addBenchmarkData } from '../../firebase/functions';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function BenchmarkDataManager() {
    const [formData, setFormData] = useState({ industry: '', stage: '', arr: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const { industry, stage, arr } = formData;
        if (!industry || !stage || !arr) {
            toast({ variant: "destructive", title: "Missing Information", description: "All fields are required." });
            return;
        }
        
        setIsLoading(true);
        try {
            const arrNumber = parseFloat(arr);
            if (isNaN(arrNumber)) {
                 toast({ variant: "destructive", title: "Invalid Input", description: "ARR must be a valid number." });
                 setIsLoading(false);
                 return;
            }

            await addBenchmarkData({ industry, stage, arr: arrNumber });
            toast({ title: "Success", description: "Benchmark data added successfully." });
            setFormData({ industry: '', stage: '', arr: '' });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Benchmark Data</CardTitle>
                <CardDescription>
                    Add a new data point to the system's benchmarking dataset. This data will be used in future analyses.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input name="industry" placeholder="Industry (e.g., SaaS)" value={formData.industry} onChange={handleChange} />
                <Input name="stage" placeholder="Stage (e.g., Series A)" value={formData.stage} onChange={handleChange} />
                <Input name="arr" placeholder="ARR (e.g., 5000000)" type="number" value={formData.arr} onChange={handleChange} />
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Data Point
                </Button>
            </CardContent>
        </Card>
    );
}

