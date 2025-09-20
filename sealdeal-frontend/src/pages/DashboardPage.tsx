import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, collectionGroup } from 'firebase/firestore';
import { Deal, Analysis } from '../types';
import DealsListView from '../components/deals/DealsListView';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DealsChart from '../components/dashboard/DealsChart';
import { Loader2, Mic } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { useToast } from '../hooks/use-toast';


export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New: Effect for "Coming Soon" toast
  useEffect(() => {
    const hasSeenToast = sessionStorage.getItem('hasSeenFeatureToast');
    if (!hasSeenToast) {
        const timer = setTimeout(() => {
            toast({
                title: (
                    <div className="flex items-center">
                        <Mic className="h-5 w-5 mr-2 text-primary" />
                        <span>Feature Preview</span>
                    </div>
                ),
                description: "A.I Voice Assist ,Audio Transcription and Analysis features are coming soon!",
                duration: 5000,
            });
            sessionStorage.setItem('hasSeenFeatureToast', 'true');
        }, 1500);

        return () => clearTimeout(timer);
    }
  }, [toast]);


  useEffect(() => {
    if (!user) return;

    // Fetch deals
    const dealsQuery = query(collection(db, 'deals'), where('ownerId', '==', user.uid));
    const unsubscribeDeals = onSnapshot(dealsQuery, (snapshot) => {
      const dealsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      } as Deal));
      setDeals(dealsData);
      setLoading(false);
    });

    // Fetch all analyses for the user
    const analysesQuery = query(collectionGroup(db, 'analysis'), where('createdBy', '==', user.uid));
    const unsubscribeAnalyses = onSnapshot(analysesQuery, (snapshot) => {
        const analysesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                analyzedAt: data.analyzedAt.toDate(),
            } as Analysis;
        });
        setAnalyses(analysesData);
    });

    return () => {
      unsubscribeDeals();
      unsubscribeAnalyses();
    };
  }, [user]);

  const enrichedAnalyses = useMemo(() => {
    return analyses.map(analysis => {
      const deal = deals.find(d => d.id === analysis.dealId);
      return {
        ...analysis,
        dealName: deal ? deal.dealName : 'Unknown Deal'
      };
    });
  }, [analyses, deals]);

  const filteredDeals = deals.filter(deal => {
      const matchesSearch = deal.dealName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
      return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex h-screen -mt-20 w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Welcome back, {user?.email || 'Analyst'}. Here's your portfolio overview.</p>
      </div>
      
      <DashboardHeader analyses={enrichedAnalyses} />
      
      <DealsChart analyses={enrichedAnalyses} />

      {/* Deals Section with Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight">Your Deals</h2>
            <div className="flex gap-2 w-full md:w-auto">
                <Input 
                    placeholder="Search deals..." 
                    className="w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="1_AwaitingUpload">Awaiting Upload</SelectItem>
                        <SelectItem value="2_Processing">Processing</SelectItem>
                        <SelectItem value="4_Analyzed">Analyzed</SelectItem>
                        <SelectItem value="Error_Analysis_Failed">Error</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DealsListView deals={filteredDeals} />
      </div>
    </div>
  );
}

