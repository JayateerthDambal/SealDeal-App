import { useState } from 'react';
import { Button } from '../ui/Button';
import DealCard from './DealCard';
import CreateDealModal from './CreateDealModal';
import { Deal } from '../../types';
import { PlusCircle, LayoutGrid, List } from 'lucide-react';

interface DealsListViewProps {
  deals: Deal[];
}

export default function DealsListView({ deals }: DealsListViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
           <Button variant="ghost" size="icon" onClick={() => setLayout('grid')} className={layout === 'grid' ? 'bg-secondary' : ''}>
                <LayoutGrid className="h-4 w-4" />
           </Button>
            <Button variant="ghost" size="icon" onClick={() => setLayout('list')} className={layout === 'list' ? 'bg-secondary' : ''}>
                <List className="h-4 w-4" />
           </Button>
          <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Deal
          </Button>
      </div>

      <CreateDealModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {deals.length > 0 ? (
        <div className={layout === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} layout={layout}/>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border-2 border-dashed border-primary/10 rounded-lg">
          <h3 className="text-xl font-semibold">No Deals Found</h3>
          <p className="text-muted-foreground mt-2">Create a new deal or adjust your filters.</p>
        </div>
      )}
    </div>
  );
}

