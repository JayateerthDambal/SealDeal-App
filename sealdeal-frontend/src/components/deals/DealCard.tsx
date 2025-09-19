import { Link } from 'react-router-dom';
import { Deal } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { FileClock, Loader2, CheckCircle, XCircle } from 'lucide-react';

const getStatusInfo = (status: Deal['status']) => {
  switch (status) {
    case '1_AwaitingUpload':
      return { Icon: FileClock, color: 'text-blue-400', text: 'Awaiting Upload' };
    case '2_Processing':
      return { Icon: Loader2, color: 'text-purple-400', text: 'Processing' };
    case '4_Analyzed':
      return { Icon: CheckCircle, color: 'text-green-400', text: 'Analyzed' };
    case 'Error_Processing_Failed':
    case 'Error_Analysis_Failed':
      return { Icon: XCircle, color: 'text-red-400', text: 'Error' };
    default:
      return { Icon: FileClock, color: 'text-gray-400', text: 'Unknown' };
  }
};

interface DealCardProps {
  deal: Deal;
  layout?: 'grid' | 'list';
}

export default function DealCard({ deal, layout = 'grid' }: DealCardProps) {
  const { Icon, color, text } = getStatusInfo(deal.status);
  const formattedDate = deal.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (layout === 'list') {
      return (
         <Link to={`/deal/${deal.id}`} className="block">
            <Card className="hover:border-primary/50 transition-colors duration-300">
                <CardContent className="p-4 flex justify-between items-center">
                     <div>
                        <h3 className="font-semibold text-lg">{deal.dealName}</h3>
                        <p className="text-sm text-muted-foreground">Created: {formattedDate}</p>
                    </div>
                    <div className={`flex items-center text-sm font-medium ${color}`}>
                        <Icon className={`h-4 w-4 mr-2 ${deal.status === '2_Processing' ? 'animate-spin' : ''}`} />
                        {text}
                    </div>
                </CardContent>
            </Card>
        </Link>
      );
  }

  // Grid layout (original)
  return (
    <Link to={`/deal/${deal.id}`} className="block group">
      <Card className="h-full bg-card/50 border-primary/10 group-hover:border-primary/50 transition-all duration-300 transform group-hover:-translate-y-1 shadow-lg group-hover:shadow-primary/20 relative overflow-hidden">
        <CardHeader>
          <CardTitle className="truncate">{deal.dealName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Created: {formattedDate}</p>
          <div className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${color} bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon className={`h-3.5 w-3.5 mr-1.5 ${deal.status === '2_Processing' ? 'animate-spin' : ''}`} />
            {text}
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Card>
    </Link>
  );
}

