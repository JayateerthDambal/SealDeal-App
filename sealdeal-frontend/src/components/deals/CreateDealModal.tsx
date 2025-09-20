import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { createDeal } from '@/firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateDealModal({ isOpen, onClose }: CreateDealModalProps) {
  const [dealName, setDealName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleCreateDeal = async () => {
    if (!dealName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a name for the deal.',
      });
      return;
    }
    
    setIsLoading(true);

    const dataToSend = { dealName: dealName.trim() };
    console.log("Attempting to create deal with data:", dataToSend);

    try {
      const result = await createDeal(dataToSend);
      console.log('Deal created successfully with ID:', result.data.dealId);
      toast({
        title: 'Success',
        description: `Deal "${dataToSend.dealName}" created successfully.`,
      });
      onClose();
      setDealName('');
    } catch (error: any) {
      console.error('Failed to create deal:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create deal',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Create New Deal</CardTitle>
          <CardDescription>Enter a name for your new deal to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="e.g., QuantumLeap Inc."
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDeal()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button onClick={handleCreateDeal} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Deal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

