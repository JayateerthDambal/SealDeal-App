import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Loader2 } from 'lucide-react';
import { createDeal } from '../../firebase/functions';
import { useToast } from '../../hooks/use-toast';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateDealModal({ isOpen, onClose }: CreateDealModalProps) {
  const [dealName, setDealName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateDeal = async () => {
    if (!dealName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for your deal.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await createDeal({ dealName });
      toast({
        title: "Success!",
        description: `Deal "${dealName}" has been created.`,
      });
      console.log('Deal created successfully:', result);
      onClose(); // Close the modal on success
      setDealName(''); // Reset the input field
    } catch (error) {
      console.error('Failed to create deal:', error);
      toast({
        title: "Error",
        description: "Failed to create the deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create a New Deal</CardTitle>
          <CardDescription>Give your deal a name to get started. You can upload documents next.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="e.g., QuantumLeap Inc."
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
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

