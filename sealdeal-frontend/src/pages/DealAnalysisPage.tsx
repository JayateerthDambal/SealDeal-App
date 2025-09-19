import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Deal, Analysis } from '../types';
import DocumentManager from '../components/deals/DocumentManager';
import AnalysisResultView from '../components/deals/AnalysisResultView';
import { Button } from '../components/ui/Button';
import { Loader2, FileText, BarChart2, Zap, Download } from 'lucide-react';
import { startComprehensiveAnalysis } from '../firebase/functions';
import { useToast } from '../hooks/use-toast';
import MetricsBar from '../components/deals/MetricsBar';
import AnalysisReport from '../components/deals/AnalysisReport';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const getStatusBadge = (status: Deal['status']) => {
  switch (status) {
    case '1_AwaitingUpload':
      return <span className="bg-blue-500/10 text-blue-400 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Awaiting Upload</span>;
    case '2_Processing':
      return <span className="bg-purple-500/10 text-purple-400 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Processing</span>;
    case '4_Analyzed':
      return <span className="bg-green-500/10 text-green-400 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Analyzed</span>;
    case 'Error_Analysis_Failed':
    case 'Error_Processing_Failed':
      return <span className="bg-destructive/10 text-destructive text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Error</span>;
    default:
      return <span className="bg-gray-500/10 text-gray-400 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Unknown</span>;
  }
};

export default function DealAnalysisPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'analysis'>('documents');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dealId) {
        setError("No deal ID provided.");
        setLoading(false);
        return;
    }

    const dealRef = doc(db, 'deals', dealId);
    const unsubscribeDeal = onSnapshot(dealRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const dealData = { id: doc.id, ...data, createdAt: data.createdAt.toDate() } as Deal;
        setDeal(dealData);
        if (dealData.status === '4_Analyzed' && activeTab !== 'analysis') {
           setActiveTab('analysis');
        }
      } else {
        setError("Deal not found.");
      }
      setLoading(false);
    });

    const analysisColRef = collection(db, 'deals', dealId, 'analysis');
    const q = query(analysisColRef, orderBy('analyzedAt', 'desc'), limit(1));
    const unsubscribeAnalysis = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const analysisData = snapshot.docs[0].data() as Analysis;
            setAnalysis(analysisData);
        } else {
            setAnalysis(null);
        }
    });

    return () => {
        unsubscribeDeal();
        unsubscribeAnalysis();
    };
  }, [dealId, activeTab]);

  const handleRunAnalysis = async () => {
    if (!dealId) return;
    setIsAnalyzing(true);
    try {
      await startComprehensiveAnalysis({ dealId });
      toast({
        title: "Analysis Started",
        description: "The comprehensive analysis is now running.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to start analysis.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(reportRef.current, { 
            scale: 2,
            windowWidth: reportRef.current.scrollWidth,
            windowHeight: reportRef.current.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / pdfWidth;
        const totalPages = Math.ceil(imgHeight / (pdfHeight * ratio));

        for (let i = 0; i < totalPages; i++) {
            const yPosition = - (i * pdfHeight * ratio);
            if (i > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, yPosition / (imgWidth/pdfWidth), pdfWidth, imgHeight / ratio);
        }
        
        pdf.save(`${deal?.dealName || 'deal'}_analysis_report.pdf`);
    } catch (error) {
        console.error("Failed to export PDF", error);
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "Could not generate the PDF report.",
        });
    } finally {
        setIsExporting(false);
    }
  };

  if (loading) { return <div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>; }
  if (error) { return <div className="text-center py-16 text-destructive">{error}</div>; }
  if (!deal) { return <div className="text-center py-16">Deal could not be loaded.</div>; }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">{deal.dealName}</h1>
          <div className="mt-2">{getStatusBadge(deal.status)}</div>
        </div>
        <div className="flex gap-2">
            {deal.status === '4_Analyzed' && analysis && (
                <Button 
                    onClick={handleExportPDF} 
                    variant="outline"
                    disabled={isExporting}
                >
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                    Export PDF
                </Button>
            )}
            <Button 
              onClick={handleRunAnalysis} 
              disabled={isAnalyzing || deal.status === '2_Processing'}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
            >
              {isAnalyzing || deal.status === '2_Processing' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Run Analysis
            </Button>
        </div>
      </div>
      
      {analysis && <MetricsBar metrics={analysis.metrics} />}

      <div className="border-b border-primary/10">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
                onClick={() => setActiveTab('documents')}
                className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/30'}`}>
                <FileText className="mr-2 h-5 w-5"/> Documents
            </button>
            {deal.status === '4_Analyzed' && (
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analysis' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/30'}`}>
                    <BarChart2 className="mr-2 h-5 w-5"/> Analysis Results
                </button>
            )}
        </nav>
      </div>

      <div>
        {activeTab === 'documents' && dealId && <DocumentManager dealId={dealId} />}
        {activeTab === 'analysis' && analysis && <AnalysisResultView analysis={analysis} />}
      </div>
      
      <div className="absolute -z-10 -left-[9999px] top-0 opacity-0">
          <AnalysisReport ref={reportRef} deal={deal} analysis={analysis} />
      </div>
    </div>
  );
}
