import { useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAccountUrl } from '@/services/algorand';
import { Wallet, ExternalLink, LogOut, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';
import ConnectWalletButton from '@/components/ConnectWalletButton';

interface WalletConnectionProps {
  onAccountChange: (accounts: string[]) => void;
}

const WalletConnection = ({ onAccountChange }: WalletConnectionProps) => {
  const { wallets, activeWallet } = useWallet();

  const connectedAccounts = activeWallet?.accounts.map(acc => acc.address) || [];

  // Auto-connect functionality completely removed to prevent popups on refresh

  const handleConnect = async (walletId: string) => {
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        await wallet.connect();
        // Get accounts after connection
        const accounts = wallet.accounts.map(acc => acc.address);
        onAccountChange(accounts);
      }
    } catch (error: any) {
      // Removed error toasts
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
    // Emoji icons removed; UI uses lucide Wallet icon instead
    return '';
  };

  if (activeWallet && connectedAccounts.length > 0) {
    return (
      <Card className="p-2 bg-gradient-primary text-white shadow-campaign">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <div>
              <p className="text-xs flex items-center gap-1">
                {activeWallet.metadata.name}
                <span className="text-xs bg-white/20 px-1 py-0.5 rounded-full">
                  Connected
                </span>
              </p>
              <p className="text-xs opacity-90">{truncateAddress(connectedAccounts[0])}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
              onClick={() => window.open(getAccountUrl(connectedAccounts[0]), '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
              onClick={handleDisconnect}
            >
              <LogOut className="h-3 w-3" />
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
      <Card className="p-8 bg-card/30 backdrop-blur-md border border-primary/20 shadow-campaign rounded-xl">
        <div className="w-full flex flex-col items-center justify-center text-center gap-5">
          <p className="text-base font-semibold">No supported wallets found</p>
          <div className="flex items-center gap-3">
            <ConnectWalletButton />
            <Button 
              className="bg-gradient-primary hover:opacity-90 shadow-fund"
              asChild
            >
              <a 
                href="https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Install Lute
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Install a wallet to connect and start using AlgoFund</p>
        </div>
      </Card>
    );
  }

  // Find Lute wallet in available wallets
  const luteWallet = availableWallets.find(wallet => wallet.id === 'lute');
  
  return (
    <div className="flex flex-col gap-2">
      {/* Direct Lute Wallet connection button */}
      {luteWallet ? (
        <Button 
          className="bg-gradient-primary hover:opacity-90 shadow-fund"
          onClick={() => handleConnect('lute')}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Lute Wallet
        </Button>
      ) : (
        <Button 
          className="bg-gradient-primary hover:opacity-90 shadow-fund"
          asChild
        >
          <a
            href="https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Install Lute Wallet
          </a>
        </Button>
      )}
      
      {/* Other wallets dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <Wallet className="mr-2 h-4 w-4" />
            Other Wallets
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
    </div>
  );
};

export default WalletConnection;