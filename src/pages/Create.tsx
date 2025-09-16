import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import CampaignForm, { CampaignFormValues } from '@/components/campaign/CampaignForm';
import DonationSection from '@/components/campaign/DonationSection';
import Leaderboard, { Donor } from '@/components/campaign/Leaderboard';
import { useCampaignStore } from '@/store/CampaignStore';

const Create = () => {
  const { activeWallet } = useWallet();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const { addCampaign } = useCampaignStore();

  const isConnected = !!activeWallet;

  const onSubmit = async (values: CampaignFormValues) => {
    setCreating(true);
    try {
      const id = Date.now().toString();
      const creator = activeWallet?.accounts[0]?.address || 'WALLET';
      const newCampaign = {
        id,
        title: values.title,
        description: values.description,
        goalAmount: parseFloat(values.goalAmount),
        raisedAmount: 0,
        deadline: new Date(values.deadline),
        creator,
        isActive: true,
        imageUrl: values.imageUrl || undefined,
        donors: [],
      };
      addCampaign(newCampaign);
      toast.success('Campaign created!');
      navigate(`/campaign/${id}`);
    } catch (err) {
      toast.error('Failed to create campaign');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDonate = async (amount: number) => {
    const address = activeWallet?.accounts[0]?.address || 'WALLET_ADDRESS';
    setDonors(prev => {
      const existing = prev.find(d => d.address === address);
      if (existing) {
        return prev.map(d => (d.address === address ? { ...d, amount: d.amount + amount } : d));
      }
      return [...prev, { address, amount }];
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-xl font-bold">Create Campaign</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CampaignForm onSubmit={onSubmit} submitLabel="Create Campaign" disabled={creating} />
          </div>

          <div className="space-y-6">
            <DonationSection onDonate={handleDonate} disabled={!isConnected} />
            <Leaderboard donors={donors} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create;


