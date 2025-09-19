import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface HighlightsCardProps {
  title: string;
  items: string[];
  variant: 'constructive' | 'destructive';
}

export default function HighlightsCard({ title, items, variant }: HighlightsCardProps) {
  const isConstructive = variant === 'constructive';
  const Icon = isConstructive ? CheckCircle : AlertTriangle;
  const textColor = isConstructive ? 'text-green-400' : 'text-red-400';

  return (
    <Card className={`bg-card/50 border-primary/10 h-full ${isConstructive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center ${textColor}`}>
          <Icon className="h-5 w-5 mr-3" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <ul className="space-y-2 list-disc list-inside text-muted-foreground">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No items identified.</p>
        )}
      </CardContent>
    </Card>
  );
}

