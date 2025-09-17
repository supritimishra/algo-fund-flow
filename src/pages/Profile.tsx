import { buildUnsignedPaymentTxn, submitSignedTransactionBase64, getReceiverAddress, sendPaymentWithWallet } from '@/services/algorand';
import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useCampaignStore } from '@/store/CampaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';


const ProfilePage = () => {
  const { activeWallet } = useWallet();
  const { campaigns } = useCampaignStore();
  const [bountyAmount, setBountyAmount] = useState('');
  const [bountyTitle, setBountyTitle] = useState('');
  const { addReward, getTokenBalance } = useCampaignStore();

  const connected = !!activeWallet;
  const addr = activeWallet?.accounts[0]?.address || 'Not connected';

  const createBounty = () => {
    // Keep function for compatibility but we no longer allow creating arbitrary bounties here.
    toast('Use the claim flow below to claim rewards for sample bounties.');
  };

  const sampleBounties = [
    { id: 'b1', title: 'Translate Docs', rewardTokens: 50 },
    { id: 'b2', title: 'Fix UI Bug', rewardTokens: 25 },
    { id: 'b3', title: 'Write Example', rewardTokens: 10 },
  ];

  const claimReward = async (bounty: { id: string; title: string; rewardTokens: number }) => {
    if (!connected) { toast.error('Connect your wallet (Lute) to claim rewards'); return; }
    try {
      const note = `Claim:${bounty.id}:${Date.now()}`;
      const txId = await (await import('@/services/algorand')).signProofWithWallet(activeWallet, addr, note);
  // On success, credit off-chain tokens (demo only)
  addReward(addr, bounty.rewardTokens);
      toast.success(`Claimed ${bounty.rewardTokens} tokens — tx ${txId}`);
    } catch (e: any) {
      if (e?.manualSign) {
        // Show manual sign flow (unsigned payload)
        setManualUnsigned(e.unsignedTxn || '');
        toast('Manual signing required — paste signed tx to submit.');
      } else {
        console.error('Claim failed:', e);
        toast.error('Claim failed');
      }
    }
  };

  // Simple badges: derived from number of donations across campaigns
  const totalDonations = campaigns.reduce((sum, c) => sum + ((c.donors || []).reduce((s, d) => s + d.amount, 0)), 0);
  const badges = [] as string[];
  if (totalDonations >= 100) badges.push('Legendary Supporter');
  if (totalDonations >= 50) badges.push('Top Backer');
  if (totalDonations >= 10) badges.push('Active Donor');
  const [manualUnsigned, setManualUnsigned] = useState('');
  const [signedB64, setSignedB64] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitSigned = async () => {
    if (!signedB64) { toast.error('Paste signed base64 first'); return; }
    setSubmitting(true);
    try {
      const txId = await submitSignedTransactionBase64(signedB64);
      toast.success(`Bounty created on-chain: ${txId}`);
      setManualUnsigned(''); setSignedB64(''); setBountyAmount(''); setBountyTitle('');
    } catch (e: any) {
      console.error('Submit signed txn failed:', e);
      toast.error('Failed to submit signed transaction');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Donor Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">Address</div>
                <div className="font-mono text-sm mb-4">{addr}</div>
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">Badges</div>
                  {badges.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No badges yet. Donate to earn badges.</div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {badges.map(b => (
                        <div key={b} className="bg-gradient-success text-white px-3 py-2 rounded-md text-sm">{b}</div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">NFT Badges</div>
                    <div className="flex gap-3 mt-2">
                      <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        <img src="/placeholder.png" alt="badge" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        <img src="/placeholder.png" alt="badge" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        <img src="/placeholder.png" alt="badge" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Available Bounties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-2">Token Balance: <strong>{getTokenBalance(addr)}</strong></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {sampleBounties.map(b => (
                      <div key={b.id} className="p-3 border rounded-md">
                        <div className="font-medium">{b.title}</div>
                        <div className="text-xs text-muted-foreground">Reward: {b.rewardTokens} tokens</div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => claimReward(b)}>Get Reward</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {manualUnsigned && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Manual Sign: Bounty Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">Unsigned Transaction (base64)</div>
                  <textarea readOnly value={manualUnsigned} className="w-full h-28 p-2 font-mono text-xs bg-surface border rounded" />
                  <div className="text-sm text-muted-foreground mt-3 mb-2">Paste Signed Transaction (base64)</div>
                  <textarea value={signedB64} onChange={(e) => setSignedB64(e.target.value)} className="w-full h-28 p-2 font-mono text-xs bg-surface border rounded" />
                  <div className="flex gap-3 mt-3">
                    <Button onClick={submitSigned} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Signed'}</Button>
                    <Button variant="outline" onClick={() => { setManualUnsigned(''); setSignedB64(''); }}>Dismiss</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Your Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">This page aggregates your donations across campaigns (placeholder).</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
