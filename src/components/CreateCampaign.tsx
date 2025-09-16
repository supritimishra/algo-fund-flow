import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateCampaignProps {
  isConnected: boolean;
  onCampaignCreate: (campaign: any) => void;
}

const CreateCampaign = ({ isConnected, onCampaignCreate }: CreateCampaignProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    try {
      // In a real app, this would deploy a smart contract
      const newCampaign = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        goalAmount: parseFloat(formData.goalAmount),
        raisedAmount: 0,
        deadline: new Date(formData.deadline),
        creator: 'YOUR_WALLET_ADDRESS', // Replace with actual connected wallet
        isActive: true,
      };

      onCampaignCreate(newCampaign);
      toast.success('Campaign created successfully!');
      setIsOpen(false);
      setFormData({ title: '', description: '', goalAmount: '', deadline: '' });
    } catch (error) {
      toast.error('Failed to create campaign');
      console.error('Campaign creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-success hover:opacity-90 shadow-fund">
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Launch New Campaign
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter campaign title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your campaign and its goals"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalAmount">Goal Amount (ALGO)</Label>
            <Input
              id="goalAmount"
              type="number"
              step="0.01"
              min="1"
              value={formData.goalAmount}
              onChange={(e) => handleInputChange('goalAmount', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Campaign Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isConnected || isCreating}
              className="flex-1 bg-gradient-success hover:opacity-90"
            >
              {isCreating ? 'Creating...' : 'Launch Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaign;