import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import CampaignForm, { CampaignFormValues } from '@/components/campaign/CampaignForm';
import Leaderboard, { Donor } from '@/components/campaign/Leaderboard';
import { useCampaignStore } from '@/store/CampaignStore';
import { createCampaignContract, getTransactionUrl, submitSignedTransactionBase64 } from '@/services/algorand';

const Create = () => {
  const { activeWallet } = useWallet();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const { addCampaign } = useCampaignStore();

  const isConnected = !!activeWallet;

  const onSubmit = async (values: CampaignFormValues) => {
    if (!activeWallet || !activeWallet.accounts?.length) {
      toast.error('Please connect your wallet before creating a campaign');
      return;
    }
    setCreating(true);
    let newCampaign: any = null;
    try {
      const id = Date.now().toString();
      const creator = activeWallet?.accounts[0]?.address || 'WALLET';
      newCampaign = {
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
      // Trigger wallet popup and on-chain tx during creation. Race against
      // a timeout so the UI doesn't get stuck on this page if confirmation
      // takes a long time. The service now tries to avoid blocking, but
      // this extra safety ensures navigation regardless.
      const createPromise = createCampaignContract(newCampaign as any, activeWallet);
      const timeoutMs = 12000;
      const result: any = await Promise.race([
        createPromise,
        new Promise(res => setTimeout(() => res({ __timedOut: true }), timeoutMs)),
      ]);

      if (result && result.__timedOut) {
        // We didn't get a response within timeout — still add the campaign
        // locally so it appears in the list, and navigate home. The
        // background operation may still finish and update later.
        (newCampaign as any).txId = undefined;
        addCampaign(newCampaign);
        toast('Transaction pending — navigating home. It may take a moment to appear on-chain.', { icon: '⏳' });
        navigate('/');
      } else {
        const { txId, appId } = result || {};
        if (appId) {
          (newCampaign as any).appId = appId;
        }
        (newCampaign as any).txId = txId;

        addCampaign(newCampaign);
        toast.success('Campaign created and transaction submitted. Opening explorer...');
        try { window.open(getTransactionUrl(txId), '_blank'); } catch (_) {}
        // Navigate to home so the newly created campaign is visible in the list
        navigate('/');
      }
    } catch (err: any) {
      // Support manual-sign fallback: createCampaignContract may throw an error
      // with `manualSign` and `unsignedTxn` when the active wallet cannot sign.
      if (err?.manualSign && err?.unsignedTxn) {
        const unsigned = err.unsignedTxn as string;
        try {
          await navigator.clipboard.writeText(unsigned);
          toast('Unsigned transaction copied to clipboard. Paste signed base64 to submit.', { icon: '✍️' });
        } catch (_) {
          // ignore clipboard failures
        }
        const signed = window.prompt('Unsigned transaction copied to clipboard. Paste signed transaction base64 to submit:');
        if (signed) {
          try {
            const txId = await submitSignedTransactionBase64(signed);
            (newCampaign as any).txId = txId;
            addCampaign(newCampaign);
            toast.success('Campaign created and transaction submitted. Opening explorer...');
            try { window.open(getTransactionUrl(txId), '_blank'); } catch (_) {}
            navigate('/');
          } catch (e) {
            console.error('Failed to submit signed create txn', e);
            toast.error('Failed to submit signed transaction');
          }
        } else {
          toast.error('Signed transaction not provided — campaign not created');
        }
      } else {
        toast.error('Failed to create campaign');
        console.error(err);
      }
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
            <Leaderboard donors={donors} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create;


