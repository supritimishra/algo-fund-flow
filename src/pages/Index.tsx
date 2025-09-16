import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWallet } from '@txnlab/use-wallet-react';
import WalletConnection from '@/components/WalletConnection';
import CampaignCard from '@/components/CampaignCard';
import CreateCampaign from '@/components/CreateCampaign';
import FundingModal from '@/components/FundingModal';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { Campaign, mockCampaigns } from '@/services/algorand';
import { Coins, TrendingUp, Users, Target } from 'lucide-react';

const Index = () => {
  const { activeWallet } = useWallet();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  const isConnected = !!activeWallet;
  const connectedAccounts = activeWallet?.accounts.map(acc => acc.address) || [];

  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raisedAmount, 0);
  const activeCampaigns = campaigns.filter(campaign => campaign.isActive).length;
  const totalBackers = campaigns.length * 15; // Mock backer count

  const handleAccountChange = (accounts: string[]) => {
    // This is handled by the useWallet hook internally
    console.log('Accounts changed:', accounts);
  };

  const handleFundCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsFundingModalOpen(true);
  };

  const handleCreateCampaign = (newCampaign: Campaign) => {
    setCampaigns(prev => [newCampaign, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-card text-card-foreground border shadow-lg',
          duration: 4000,
        }}
      />
      
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AlgoFund</h1>
                <p className="text-sm text-muted-foreground">Crowdfunding on Algorand</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <CreateCampaign 
                isConnected={isConnected}
                onCampaignCreate={handleCreateCampaign}
              />
              {!isConnected ? (
                <ConnectWalletButton />
              ) : (
                <WalletConnection onAccountChange={handleAccountChange} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="py-8 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-primary">
                {totalRaised.toLocaleString()} ALGO
              </h3>
              <p className="text-muted-foreground">Total Raised</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mx-auto mb-3">
                <Target className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-success">
                {activeCampaigns}
              </h3>
              <p className="text-muted-foreground">Active Campaigns</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mx-auto mb-3">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-accent">
                {totalBackers.toLocaleString()}
              </h3>
              <p className="text-muted-foreground">Total Backers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Campaigns</h2>
              <p className="text-muted-foreground">
                Discover and support innovative projects on Algorand
              </p>
            </div>
          </div>

          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onFund={handleFundCampaign}
                  isConnected={isConnected}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create a campaign and start raising funds
              </p>
              <CreateCampaign 
                isConnected={isConnected}
                onCampaignCreate={handleCreateCampaign}
              />
            </div>
          )}
        </div>
      </section>

      {/* Connect Wallet CTA */}
      {!isConnected && (
        <section className="py-12 bg-gradient-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Algorand wallet to create campaigns and fund innovative projects
            </p>
            <WalletConnection onAccountChange={handleAccountChange} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Built on Algorand • View transactions on{' '}
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
      </footer>

      {/* Funding Modal */}
      <FundingModal
        campaign={selectedCampaign}
        isOpen={isFundingModalOpen}
        onClose={() => {
          setIsFundingModalOpen(false);
          setSelectedCampaign(null);
        }}
      />
    </div>
  );
};

export default Index;