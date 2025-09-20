import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Deal, Analysis } from '../types';
import { Button } from '../components/ui/Button';
import { getComparisonData } from '../firebase/functions';
import { Loader2, Scale } from 'lucide-react';
import ComparisonTable from '../components/compare/ComparisonTable';
import MultiSelectDropdown from '../components/ui/MultiSelectDropdown';

// Define the structure of the data we'll compare
export interface ComparisonData {
    dealId: string;
    dealName: string;
    analysis: Analysis | null;
}

export default function ComparePage() {
    const { user } = useAuth();
    const [allDeals, setAllDeals] = useState<Deal[]>([]);
    const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
    const [comparisonData, setComparisonData] = useState<ComparisonData[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDeals, setIsFetchingDeals] = useState(true);

    useEffect(() => {
        if (!user) return;
        // Fetch only deals that have been analyzed to populate the selector
        const dealsQuery = query(
            collection(db, 'deals'),
            where('ownerId', '==', user.uid),
            where('status', '==', '4_Analyzed')
        );

        const unsubscribe = onSnapshot(dealsQuery, (snapshot) => {
            const dealsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
            } as Deal));
            setAllDeals(dealsData);
            setIsFetchingDeals(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCompare = async () => {
        if (selectedDealIds.length < 2) {
            // Optionally, show a toast notification here
            alert("Please select at least two deals to compare.");
            return;
        }
        setIsLoading(true);
        setComparisonData(null);
        try {
            const result = await getComparisonData({ dealIds: selectedDealIds });
            // Correctly access the nested 'data' property
            setComparisonData(result.data.data);
        } catch (error) {
            console.error("Failed to get comparison data:", error);
            // Optionally, show an error toast
        } finally {
            setIsLoading(false);
        }
    };

    const dealOptions = allDeals.map(deal => ({ value: deal.id, label: deal.dealName }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">Compare Deals</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Select multiple deals to see a side-by-side comparison of their key metrics.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card/50 rounded-lg border border-primary/10">
                <div className="flex-grow w-full">
                     <MultiSelectDropdown
                        options={dealOptions}
                        selectedValues={selectedDealIds}
                        onChange={setSelectedDealIds}
                        placeholder="Select deals to compare..."
                        disabled={isFetchingDeals}
                    />
                </div>
                <Button onClick={handleCompare} disabled={isLoading || selectedDealIds.length < 2} className="w-full md:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scale className="mr-2 h-4 w-4" />}
                    Compare ({selectedDealIds.length})
                </Button>
            </div>

            {isLoading && (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}

            {comparisonData && <ComparisonTable data={comparisonData} />}
        </div>
    );
}