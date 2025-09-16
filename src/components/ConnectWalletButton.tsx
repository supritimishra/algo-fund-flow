import { useWallet } from '@txnlab/use-wallet-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const ConnectWalletButton = () => {
  const { wallets, activeWallet } = useWallet();

  const connectToLuteWallet = async () => {
    try {
      // Find Lute wallet
      const luteWallet = wallets.find(w => w.id === 'lute');
      
      if (luteWallet) {
        await luteWallet.connect();
        toast.success('Connected to Lute wallet');
      } else {
        // If Lute wallet is not available, open the Chrome Web Store
        toast.error('Lute wallet not installed. Opening Chrome Web Store...');
        window.open('https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh', '_blank');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect to Lute wallet');
    }
  };

  if (activeWallet) {
    return null; // Don't show button if already connected
  }

  return (
    <Button 
      onClick={connectToLuteWallet}
      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 h-8"
      size="sm"
    >
      Connect Wallet
    </Button>
  );
};

export default ConnectWalletButton;