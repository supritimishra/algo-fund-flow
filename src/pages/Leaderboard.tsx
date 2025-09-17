import { useCampaignStore } from '@/store/CampaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

const LeaderboardPage = () => {
  const { campaigns } = useCampaignStore();

  const allDonations = useMemo(() => {
    const entries: { campaignId: string; campaignTitle: string; address: string; amount: number }[] = [];
    campaigns.forEach(c => {
      (c.donors || []).forEach(d => {
        entries.push({ campaignId: c.id, campaignTitle: c.title, address: d.address, amount: d.amount });
      });
    });
    // sort newest by amount desc
    return entries.sort((a, b) => b.amount - a.amount);
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Manual Leaderboard — All Donations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allDonations.map((d, i) => (
            <Card key={d.campaignId + d.address + i}>
              <CardHeader>
                <CardTitle className="text-sm">{d.campaignTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{d.address}</div>
                    <div className="text-xs text-muted-foreground">Donation #{i + 1}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold">{d.amount.toLocaleString()} ALGO</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {allDonations.length === 0 && (
            <div className="text-muted-foreground">No donations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
