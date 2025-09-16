import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@txnlab/use-wallet-react';
import DonationSection from '@/components/campaign/DonationSection';
import Leaderboard from '@/components/campaign/Leaderboard';
import { useCampaignStore } from '@/store/CampaignStore';

const CampaignPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWallet } = useWallet();
  const location = useLocation();
  const { getCampaign, addDonation } = useCampaignStore();
  const campaignFromState = (location.state as any)?.campaign;
  const campaign = useMemo(() => {
    if (campaignFromState && campaignFromState.id === id) return campaignFromState;
    return id ? getCampaign(id) : undefined;
  }, [id, getCampaign, campaignFromState]);

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConnected = !!activeWallet;
  const max = Math.max(campaign.goalAmount - campaign.raisedAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {campaign.imageUrl && (
              <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-64 object-cover rounded-md" />
            )}
            <Card>
              <CardHeader>
                <CardTitle>{campaign.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{campaign.description}</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <DonationSection
              onDonate={async (amt) => {
                const addr = activeWallet?.accounts[0]?.address || 'WALLET';
                addDonation(campaign.id, addr, amt);
              }}
              max={max}
              disabled={!isConnected || max <= 0}
            />
            <Leaderboard donors={campaign.donors || []} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPage;


