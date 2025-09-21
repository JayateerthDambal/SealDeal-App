import { Link } from 'react-router-dom';
import { Deal } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { FileClock, Loader2, CheckCircle, XCircle } from 'lucide-react';

const getStatusInfo = (status: Deal['status']) => {
  switch (status) {
    case '1_AwaitingUpload':
      return { 
        Icon: FileClock, 
        color: 'text-info', 
        bgColor: 'bg-info/10', 
        borderColor: 'border-info/20',
        text: 'Awaiting Upload' 
      };
    case '2_Processing':
      return { 
        Icon: Loader2, 
        color: 'text-warning', 
        bgColor: 'bg-warning/10', 
        borderColor: 'border-warning/20',
        text: 'Processing' 
      };
    case '4_Analyzed':
      return { 
        Icon: CheckCircle, 
        color: 'text-success', 
        bgColor: 'bg-success/10', 
        borderColor: 'border-success/20',
        text: 'Analyzed' 
      };
    case 'Error_Processing_Failed':
    case 'Error_Analysis_Failed':
      return { 
        Icon: XCircle, 
        color: 'text-destructive', 
        bgColor: 'bg-destructive/10', 
        borderColor: 'border-destructive/20',
        text: 'Error' 
      };
    default:
      return { 
        Icon: FileClock, 
        color: 'text-muted-foreground', 
        bgColor: 'bg-muted', 
        borderColor: 'border-muted',
        text: 'Unknown' 
      };
  }
};

interface DealCardProps {
  deal: Deal;
  layout?: 'grid' | 'list';
}

export default function DealCard({ deal, layout = 'grid' }: DealCardProps) {
  const { Icon, color, bgColor, borderColor, text } = getStatusInfo(deal.status);
  const formattedDate = deal.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (layout === 'list') {
      return (
         <Link to={`/deal/${deal.id}`} className="block">
            <Card className="hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <CardContent className="p-4 flex justify-between items-center">
                     <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">{deal.dealName}</h3>
                        <p className="text-sm text-muted-foreground">Created: {formattedDate}</p>
                    </div>
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${color} ${bgColor} ${borderColor} border`}>
                        <Icon className={`h-4 w-4 mr-2 ${deal.status === '2_Processing' ? 'animate-spin' : ''}`} />
                        {text}
                    </div>
                </CardContent>
            </Card>
        </Link>
      );
  }

  // Grid layout (enhanced)
  return (
    <Link to={`/deal/${deal.id}`} className="block group">
      <Card className="h-full transition-all duration-300 transform group-hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden border hover:border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="truncate text-foreground group-hover:text-primary transition-colors">
            {deal.dealName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Created: {formattedDate}
          </p>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${color} ${bgColor} ${borderColor} border`}>
            <Icon className={`h-3.5 w-3.5 mr-1.5 ${deal.status === '2_Processing' ? 'animate-spin' : ''}`} />
            {text}
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Card>
    </Link>
  );
}

