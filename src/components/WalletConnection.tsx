import { useWallet } from '@txnlab/use-wallet-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAccountUrl } from '@/services/algorand';
import { Wallet, ExternalLink, LogOut, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';

interface WalletConnectionProps {
  onAccountChange: (accounts: string[]) => void;
}

const WalletConnection = ({ onAccountChange }: WalletConnectionProps) => {
  const { wallets, activeWallet } = useWallet();

  const connectedAccounts = activeWallet?.accounts.map(acc => acc.address) || [];

  const handleConnect = async (walletId: string) => {
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        await wallet.connect();
        // Get accounts after connection
        const accounts = wallet.accounts.map(acc => acc.address);
        onAccountChange(accounts);
        toast.success(`${wallet.metadata.name} connected successfully!`);
      }
    } catch (error: any) {
      if (error.message?.includes('cancelled') || error.message?.includes('rejected')) {
        toast.error('Connection cancelled by user');
      } else {
        toast.error(`Failed to connect wallet: ${error.message}`);
      }
      console.error('Wallet connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    if (activeWallet) {
      try {
        await activeWallet.disconnect();
        onAccountChange([]);
        toast.success('Wallet disconnected');
      } catch (error) {
        console.error('Disconnect error:', error);
        toast.error('Failed to disconnect wallet');
      }
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWalletIcon = (walletId: string) => {
    switch (walletId) {
      case 'lute':
        return '🎵'; // Lute icon
      case 'pera':
        return '🍐'; // Pera icon
      case 'defly':
        return '🦋'; // Defly icon
      case 'exodus':
        return '📱'; // Exodus icon
      default:
        return '👛'; // Generic wallet icon
    }
  };

  if (activeWallet && connectedAccounts.length > 0) {
    return (
      <Card className="p-4 bg-gradient-primary text-white shadow-campaign">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getWalletIcon(activeWallet.id)}</span>
            <div>
              <p className="font-medium flex items-center gap-2">
                {activeWallet.metadata.name}
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Connected
                </span>
              </p>
              <p className="text-sm opacity-90">{truncateAddress(connectedAccounts[0])}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => window.open(getAccountUrl(connectedAccounts[0]), '_blank')}
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

  // Show available wallets for connection
  const availableWallets = wallets.filter(wallet => wallet.isActive);

  if (availableWallets.length === 0) {
    return (
      <Card className="p-4 border-warning bg-warning/10">
        <p className="text-center text-sm">
          No supported wallets found. Please install{' '}
          <a 
            href="https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Lute Wallet
          </a>{' '}
          or another Algorand wallet.
        </p>
      </Card>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-fund">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {availableWallets.map((wallet) => (
          <DropdownMenuItem
            key={wallet.id}
            onClick={() => handleConnect(wallet.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{getWalletIcon(wallet.id)}</span>
            <div>
              <p className="font-medium">{wallet.metadata.name}</p>
              <p className="text-xs text-muted-foreground">
                {wallet.isActive ? 'Ready to connect' : 'Install required'}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <a
            href="https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Install Lute Wallet</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletConnection;