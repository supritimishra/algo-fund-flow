import { useState } from 'react';
import { useCampaignStore } from '@/store/CampaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Leaderboard from '@/components/campaign/Leaderboard';
import { useWallet } from '@txnlab/use-wallet-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CampaignCard from '@/components/CampaignCard';

const DonatePage = () => {
  const { campaigns, addDonation } = useCampaignStore();
  const [campaignId, setCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [amount, setAmount] = useState('');
  const { activeWallet } = useWallet();
  const navigate = useNavigate();

  const selected = campaigns.find(c => c.id === campaignId);
  const donate = () => {
    if (!selected) return;
    const addr = activeWallet?.accounts[0]?.address || 'WALLET';
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    addDonation(selected.id, addr, value);
    setAmount('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}> 
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-xl font-bold">Donate</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/create')}>Create Campaign</Button>
            <Button onClick={() => navigate('/')}>Explore</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Select Campaign and Donate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Campaign</Label>
                  <Select value={campaignId} onValueChange={setCampaignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (ALGO)</Label>
                  <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <Button className="bg-gradient-fund" disabled={!campaignId || !amount} onClick={donate}>
                Donate {amount || '0'} ALGO
              </Button>
            </CardContent>
          </Card>
          <div>
            <Leaderboard donors={selected?.donors || []} />
          </div>
        </div>

        {/* Existing Campaigns */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Existing Campaigns</h2>
          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onFund={() => navigate(`/campaign/${c.id}`)}
                  isConnected={!!activeWallet}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No campaigns yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonatePage;


