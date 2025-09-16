import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Campaign, fundCampaign, getTransactionUrl } from '@/services/algorand';
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
      const message = error?.message || 'Transaction failed. Please try again.';
      toast.error(message);
    } finally {
      setIsFunding(false);
    }
  };

  const progressPercentage = (campaign.raisedAmount / campaign.goalAmount) * 100;
  const remainingAmount = campaign.goalAmount - campaign.raisedAmount;

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
            <h4 className="font-semibold">{campaign.title}</h4>
            <div className="text-sm text-muted-foreground">
              <p>Goal: {campaign.goalAmount.toLocaleString()} ALGO</p>
              <p>Raised: {campaign.raisedAmount.toLocaleString()} ALGO ({progressPercentage.toFixed(1)}%)</p>
              <p>Remaining: {remainingAmount.toLocaleString()} ALGO</p>
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