import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { connectWallet, disconnectWallet, peraWallet, getAccountUrl } from '@/services/algorand';
import { Wallet, ExternalLink, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface WalletConnectionProps {
  onAccountChange: (accounts: string[]) => void;
}

const WalletConnection = ({ onAccountChange }: WalletConnectionProps) => {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccounts(accounts);
          onAccountChange(accounts);
        }
      })
      .catch(console.error);

    // Listen for disconnect events
    peraWallet.connector?.on('disconnect', () => {
      setAccounts([]);
      onAccountChange([]);
    });
  }, [onAccountChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const connectedAccounts = await connectWallet();
      setAccounts(connectedAccounts);
      onAccountChange(connectedAccounts);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setAccounts([]);
    onAccountChange([]);
    toast.success('Wallet disconnected');
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (accounts.length > 0) {
    return (
      <Card className="p-4 bg-gradient-primary text-white shadow-campaign">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5" />
            <div>
              <p className="font-medium">Connected</p>
              <p className="text-sm opacity-90">{truncateAddress(accounts[0])}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => window.open(getAccountUrl(accounts[0]), '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-gradient-primary hover:opacity-90 shadow-fund"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletConnection;