import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, collectionGroup, getDocs } from 'firebase/firestore';
import { Deal, Analysis } from '../types';
import DealsListView from '../components/deals/DealsListView';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DealsChart from '../components/dashboard/DealsChart';
import { StakeholderOverview } from '../components/dashboard/StakeholderOverview';
import { Loader2, BarChart3, PieChart } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';


export default function DashboardPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Function to fetch analyses for all user deals
  const fetchAnalysesForDeals = async (userDeals: Deal[]) => {
    try {
      const allAnalyses: Analysis[] = [];
      
      for (const deal of userDeals) {
        try {
          const analysisQuery = query(
            collection(db, 'deals', deal.id, 'analysis')
          );
          const snapshot = await getDocs(analysisQuery);
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            allAnalyses.push({
              ...data,
              id: doc.id,
              dealId: deal.id,
              analyzedAt: data.analyzedAt && data.analyzedAt.toDate ? data.analyzedAt.toDate() : new Date(),
            } as Analysis);
          });
        } catch (dealError) {
          console.log(`No analyses found for deal ${deal.id}:`, dealError);
        }
      }
      
      setAnalyses(allAnalyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setAnalyses([]);
    }
  };

  useEffect(() => {
    if (!user) return;

    try {
      // Fetch deals
      const dealsQuery = query(collection(db, 'deals'), where('ownerId', '==', user.uid));
      const unsubscribeDeals = onSnapshot(dealsQuery, (snapshot) => {
        try {
          const dealsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
            } as Deal;
          });
          setDeals(dealsData);
          setLoading(false);
          
          // Fetch analyses for the deals
          fetchAnalysesForDeals(dealsData);
        } catch (error) {
          console.error('Error processing deals data:', error);
          setLoading(false);
        }
      }, (error) => {
        console.error('Error fetching deals:', error);
        setLoading(false);
      });

      return () => {
        unsubscribeDeals();
      };
    } catch (error) {
      console.error('Error setting up data subscriptions:', error);
      setLoading(false);
    }
  }, [user]);

  // Combine analyses with their deal names
  const enrichedAnalyses = useMemo(() => {
    try {
      return analyses.map(analysis => {
        const deal = deals.find(d => d.id === analysis.dealId);
        return {
          ...analysis,
          dealName: deal ? deal.dealName : 'Unknown Deal'
        };
      });
    } catch (error) {
      console.error('Error enriching analyses:', error);
      return [];
    }
  }, [analyses, deals]);

  const filteredDeals = useMemo(() => {
    try {
      return deals.filter(deal => {
        const matchesSearch = deal.dealName && deal.dealName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering deals:', error);
      return [];
    }
  }, [deals, searchTerm, statusFilter]);

  // Calculate stakeholder metrics - MOVED BEFORE EARLY RETURN
  const stakeholderMetrics = useMemo(() => {
    try {
      const activeDeals = deals.filter(d => d.status === '2_Processing').length;
      const completedAnalyses = deals.filter(d => d.status === '4_Analyzed').length;
      const avgDealSize = analyses.length > 0 
        ? `$${(analyses.reduce((sum, a) => sum + (a.metrics?.arr?.value || 0), 0) / analyses.length / 1000).toFixed(0)}K`
        : '$0';
      const successRate = analyses.length > 0 
        ? Math.round((analyses.filter(a => a.investment_memo?.investment_recommendation === 'Strong Candidate').length / analyses.length) * 100)
        : 0;
      const pendingReviews = deals.filter(d => d.status === '4_Analyzed').length;

      return {
        totalDeals: deals.length,
        activeDeals,
        completedAnalyses,
        avgDealSize,
        successRate,
        pendingReviews
      };
    } catch (error) {
      console.error('Error calculating stakeholder metrics:', error);
      return {
        totalDeals: 0,
        activeDeals: 0,
        completedAnalyses: 0,
        avgDealSize: '$0',
        successRate: 0,
        pendingReviews: 0
      };
    }
  }, [deals, analyses]);

  if (loading) {
    return <div className="flex h-screen -mt-20 w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-primary">Investment</span>
            <span className="text-foreground"> Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Welcome back, <span className="font-medium">{user?.email?.split('@')[0] || 'Analyst'}</span>. 
            Here's your portfolio intelligence overview.
          </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            Deals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StakeholderOverview {...stakeholderMetrics} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DashboardHeader analyses={enrichedAnalyses} />
          <DealsChart analyses={enrichedAnalyses} />
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

