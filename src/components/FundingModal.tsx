import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Campaign, fundCampaign, getTransactionUrl } from '@/services/algorand';
import { useCampaignStore } from '@/store/CampaignStore';
import { submitSignedTransactionBase64 } from '@/services/algorand';
import { useWallet } from '@txnlab/use-wallet-react';
import { Target, ExternalLink, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

interface FundingModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
}

const FundingModal = ({ campaign, isOpen, onClose }: FundingModalProps) => {
  const { activeWallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const { addDonation, getCampaign } = useCampaignStore();

  // Always read the latest campaign data from the store by id so leaderboard
  // and amounts reflect updates made via `addDonation` while the modal is open.
  const currentCampaign = campaign ? getCampaign(campaign.id) || campaign : null;
  const [manualUnsigned, setManualUnsigned] = useState<string | null>(null);
  const [signedTxnB64, setSignedTxnB64] = useState('');

  if (!campaign) return null;

  const connectedAccount = activeWallet?.accounts[0]?.address || '';

  const handleFund = async () => {
    const fundAmount = parseFloat(amount);
    
    if (!fundAmount || fundAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!activeWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsFunding(true);
    try {
      const txId = await fundCampaign(campaign.id, fundAmount, activeWallet);

      // Update local store so leaderboard/top donors refresh
  const donorAddr = activeWallet?.accounts[0]?.address || 'WALLET_ADDRESS';
  try { console.debug('[FundingModal] calling addDonation', campaign.id, donorAddr, fundAmount); } catch (_) {}
  addDonation(campaign.id, donorAddr, fundAmount);

      toast.success(
        `Transaction confirmed. View on explorer`,
        {
          id: 'tx-success',
        }
      );
      // Optional: open explorer in new tab
      window.open(getTransactionUrl(txId), '_blank');
      
      setAmount('');
      onClose();
    } catch (error: any) {
      console.error('Funding error:', error);
      // Support manual-sign fallback: error carries unsignedTxn when wallet cannot sign
      if (error?.manualSign && error?.unsignedTxn) {
        setManualUnsigned(error.unsignedTxn);
        toast('Manual signing required — copy the unsigned transaction and sign it externally.', { icon: '✍️' });
      } else {
        const message = error?.message || 'Transaction failed. Please try again.';
        toast.error(message);
      }
    } finally {
      setIsFunding(false);
    }
  };

  const progressPercentage = ((currentCampaign?.raisedAmount ?? campaign.raisedAmount) / (currentCampaign?.goalAmount ?? campaign.goalAmount)) * 100;
  const remainingAmount = (currentCampaign?.goalAmount ?? campaign.goalAmount) - (currentCampaign?.raisedAmount ?? campaign.raisedAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Fund Campaign
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">{currentCampaign?.title || campaign.title}</h4>
              <div className="text-sm text-muted-foreground">
                <p>Goal: {(currentCampaign?.goalAmount ?? campaign.goalAmount).toLocaleString()} ALGO</p>
                <p>Raised: {(currentCampaign?.raisedAmount ?? campaign.raisedAmount).toLocaleString()} ALGO ({progressPercentage.toFixed(1)}%)</p>
                <p>Remaining: {((currentCampaign?.goalAmount ?? campaign.goalAmount) - (currentCampaign?.raisedAmount ?? campaign.raisedAmount)).toLocaleString()} ALGO</p>
              </div>
            </div>

          <div className="space-y-2">
            <Label htmlFor="fundAmount">Amount to Fund (ALGO)</Label>
            <Input
              id="fundAmount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: 0.01 ALGO • Maximum: {remainingAmount.toFixed(2)} ALGO
            </p>
          </div>

          {connectedAccount && (
            <div className="bg-gradient-primary/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-primary" />
                <span>Connected: {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFund}
              disabled={isFunding || !amount || !activeWallet}
              className="flex-1 bg-gradient-fund hover:opacity-90"
            >
              {isFunding ? 'Processing...' : `Fund ${amount || '0'} ALGO`}
            </Button>
          </div>

          {manualUnsigned && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Manual Sign Required</p>
              <p className="text-xs text-muted-foreground">Unsigned transaction (base64). Copy this, sign with an external tool or wallet (Lute mobile app can import base64), then paste the signed base64 below and submit.</p>
              <textarea readOnly className="w-full p-2 bg-muted/20 text-xs rounded" rows={3} value={manualUnsigned} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(manualUnsigned);
                    toast.success('Unsigned transaction copied to clipboard');
                  } catch (e) {
                    console.error('Copy failed', e);
                    toast.error('Copy failed');
                  }
                }}>Copy Unsigned</Button>
                <Button variant="outline" onClick={() => {
                  try {
                    const blob = new Blob([manualUnsigned], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `unsigned_tx_${Date.now()}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast.success('Downloaded unsigned transaction');
                  } catch (e) {
                    console.error('Download failed', e);
                    toast.error('Download failed');
                  }
                }}>Download Unsigned</Button>
                <Button variant="outline" onClick={() => {
                  try {
                    // Best-effort deep link for Lute mobile app — may vary by platform/version
                    const encoded = encodeURIComponent(manualUnsigned);
                    const luteUrl = `lute://sign?txn=${encoded}`;
                    window.open(luteUrl, '_blank');
                    toast('Attempting to open Lute. If nothing happens, use the mobile app to import the unsigned transaction.', { icon: '📱' });
                  } catch (e) {
                    console.error('Open Lute failed', e);
                    toast.error('Could not open Lute');
                  }
                }}>Open in Lute</Button>
              </div>
              <Label htmlFor="signedTxn">Paste signed transaction (base64)</Label>
              <Input id="signedTxn" value={signedTxnB64} onChange={(e) => setSignedTxnB64(e.target.value)} placeholder="Signed transaction base64" />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { setManualUnsigned(null); setSignedTxnB64(''); }}>Cancel Manual</Button>
                <Button onClick={async () => {
                  if (!signedTxnB64) { toast.error('Please paste signed transaction base64'); return; }
                  setIsFunding(true);
                  try {
                    const txId = await submitSignedTransactionBase64(signedTxnB64);
                    // Update local store to reflect donation
                    const donorAddr = activeWallet?.accounts[0]?.address || '';
                    try { console.debug('[FundingModal] manual submit addDonation', campaign.id, donorAddr, parseFloat(amount)); } catch (_) {}
                    addDonation(campaign.id, donorAddr, parseFloat(amount));
                    toast.success('Transaction submitted. Opening explorer...');
                    window.open(getTransactionUrl(txId), '_blank');
                    setAmount('');
                    setManualUnsigned(null);
                    setSignedTxnB64('');
                    onClose();
                  } catch (e) {
                    console.error(e);
                    toast.error('Failed to submit signed transaction');
                  } finally { setIsFunding(false); }
                }}>Submit Signed Tx</Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Transaction will be viewable on{' '}
            <a 
              href="https://testnet.algoexplorer.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Algorand Explorer
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FundingModal;