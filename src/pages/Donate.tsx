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
import toast from 'react-hot-toast';
import { fundCampaign, getTransactionUrl, submitSignedTransactionBase64 } from '@/services/algorand';

const DonatePage = () => {
  const { campaigns, addDonation } = useCampaignStore();
  const [campaignId, setCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [amount, setAmount] = useState('');
  const { activeWallet } = useWallet();
  const navigate = useNavigate();

  const selected = campaigns.find(c => c.id === campaignId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualUnsigned, setManualUnsigned] = useState<string | null>(null);
  const [signedTxnB64, setSignedTxnB64] = useState('');

  const donate = async () => {
    if (!selected) return;
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!activeWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      const txId = await fundCampaign(selected.id, value, activeWallet);
      // On success, update local store and UI
  const addr = activeWallet?.accounts[0]?.address || 'WALLET';
  try { console.debug('[DonatePage] addDonation after fundCampaign', selected.id, addr, value); } catch (_) {}
  addDonation(selected.id, addr, value);
      setAmount('');
      toast.success('Transaction confirmed. Opening explorer');
      try { window.open(getTransactionUrl(txId), '_blank'); } catch (_) {}
    } catch (error: any) {
      console.error('Funding error:', error);
      // Handle manual-sign fallback
      if (error?.manualSign && error?.unsignedTxn) {
        setManualUnsigned(error.unsignedTxn);
        toast('Manual signing required — copy the unsigned transaction and sign it externally.', { icon: '✍️' });
      } else {
        const message = error?.message || 'Transaction failed. Please try again.';
        toast.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
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
              {manualUnsigned && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold">Manual Sign Required</p>
                  <p className="text-xs text-muted-foreground">Unsigned transaction (base64). Copy this, sign with an external tool or wallet (Lute mobile app can import base64), then paste the signed base64 below and submit.</p>
                  <textarea readOnly className="w-full p-2 bg-muted/20 text-xs rounded" rows={3} value={manualUnsigned} />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
                      try { await navigator.clipboard.writeText(manualUnsigned); toast.success('Unsigned transaction copied to clipboard'); } catch (e) { console.error(e); toast.error('Copy failed'); }
                    }}>Copy Unsigned</Button>
                    <Button variant="outline" onClick={() => {
                      try {
                        const blob = new Blob([manualUnsigned], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `unsigned_tx_${Date.now()}.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                        toast.success('Downloaded unsigned transaction');
                      } catch (e) { console.error(e); toast.error('Download failed'); }
                    }}>Download Unsigned</Button>
                    <Button variant="outline" onClick={() => {
                      try { const encoded = encodeURIComponent(manualUnsigned); const luteUrl = `lute://sign?txn=${encoded}`; window.open(luteUrl, '_blank'); toast('Attempting to open Lute. If nothing happens, use the mobile app to import the unsigned transaction.', { icon: '📱' }); } catch (e) { console.error(e); toast.error('Could not open Lute'); }
                    }}>Open in Lute</Button>
                  </div>
                  <Label htmlFor="signedTxn">Paste signed transaction (base64)</Label>
                  <Input id="signedTxn" value={signedTxnB64} onChange={(e) => setSignedTxnB64(e.target.value)} placeholder="Signed transaction base64" />
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => { setManualUnsigned(null); setSignedTxnB64(''); }}>Cancel Manual</Button>
                    <Button onClick={async () => {
                      if (!signedTxnB64) { toast.error('Please paste signed transaction base64'); return; }
                      setIsProcessing(true);
                      try {
                        const txId = await submitSignedTransactionBase64(signedTxnB64);
                        // Update store locally — use connected account if available
                        const addr = activeWallet?.accounts[0]?.address || 'WALLET';
                        try { console.debug('[DonatePage] addDonation after manual submit', selected.id, addr, parseFloat(amount)); } catch (_) {}
                        addDonation(selected.id, addr, parseFloat(amount));
                        toast.success('Transaction submitted. Opening explorer...');
                        window.open(getTransactionUrl(txId), '_blank');
                        setAmount('');
                        setManualUnsigned(null);
                        setSignedTxnB64('');
                      } catch (e) { console.error(e); toast.error('Failed to submit signed transaction'); }
                      finally { setIsProcessing(false); }
                    }}>Submit Signed Tx</Button>
                  </div>
                </div>
              )}
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


