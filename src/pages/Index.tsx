import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWallet } from '@txnlab/use-wallet-react';
import WalletConnection from '@/components/WalletConnection';
import CampaignCard from '@/components/CampaignCard';
import CreateCampaign from '@/components/CreateCampaign';
import FundingModal from '@/components/FundingModal';
import { Campaign } from '@/services/algorand';
import { useCampaignStore } from '@/store/CampaignStore';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { Coins, TrendingUp, Users, Target, Shield, Zap, Globe, Lock, Award, Heart } from 'lucide-react';
import HeroBackground from '@/components/HeroBackground';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import DonateButton from '@/components/DonateButton';

const Index = () => {
  const { activeWallet } = useWallet();
  const { campaigns } = useCampaignStore();
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

  const handleCreateCampaign = (_newCampaign: Campaign) => {};
  const navigate = useNavigate();
  const { wallets } = useWallet();

  const getStarted = async () => {
    try {
      // If already connected, just navigate
      if (activeWallet) {
        navigate('/create');
        return;
      }

      // attempt to connect (open Lute if available)
      const lute = wallets.find(w => w.id === 'lute');
      if (lute) {
        await lute.connect();
      } else {
        window.open('https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh', '_blank');
      }

      // navigate after connect
      navigate('/create');
    } catch (err) {
      console.error('Get started/connect error', err);
      navigate('/create');
    }
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
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DonateButton />
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
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-background/95">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">Support projects that matter — fast, low-fee crowdfunding on Algorand</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mb-6">Create campaigns and accept donations with instant finality, transparent history on-chain, and minimal fees. Join a global community of creators and backers.</p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={getStarted}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-400 to-blue-500 text-white px-5 py-3 rounded-lg shadow-md hover:shadow-lg"
                >
                  Get Started
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">{totalRaised.toLocaleString()} ALGO</div>
                    <div className="text-xs">Total Raised</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">{totalBackers.toLocaleString()}</div>
                    <div className="text-xs">Backers</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-full h-80 md:h-96">
              <HeroBackground />
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/placeholder.png"
                  alt="hero"
                  className="w-full max-w-lg rounded-xl shadow-xl opacity-95"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Why Choose AlgoFund */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose AlgoFund</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the future of crowdfunding with Algorand's cutting-edge blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center group border rounded-xl p-6 bg-card shadow-campaign hover:shadow-fund transition-shadow">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Blockchain Security</h3>
              <p className="text-muted-foreground">
                Your funds are protected by Algorand's secure blockchain with cryptographic guarantees
              </p>
            </div>

            <div className="text-center group border rounded-xl p-6 bg-card shadow-campaign hover:shadow-fund transition-shadow">
              <div className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Transactions</h3>
              <p className="text-muted-foreground">
                Donations are processed instantly with finality in under 4 seconds
              </p>
            </div>

            <div className="text-center group border rounded-xl p-6 bg-card shadow-campaign hover:shadow-fund transition-shadow">
              <div className="w-16 h-16 bg-gradient-fund rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Global Access</h3>
              <p className="text-muted-foreground">
                Support campaigns worldwide with borderless, permissionless transactions
              </p>
            </div>

            <div className="text-center group border rounded-xl p-6 bg-card shadow-campaign hover:shadow-fund transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Transparent Funding</h3>
              <p className="text-muted-foreground">
                All transactions are publicly verifiable on the Algorand blockchain
              </p>
            </div>

            <div className="text-center group border rounded-xl p-6 bg-card shadow-campaign hover:shadow-fund transition-shadow">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Low Fees</h3>
              <p className="text-muted-foreground">
                Minimal transaction costs mean more of your donation goes to the cause
              </p>
            </div>

            <div className="text-center group border rounded-xl p-6 bg-card shadow-campaign hover:shadow-fund transition-shadow">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Heart className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Impact</h3>
              <p className="text-muted-foreground">
                Join a community of changemakers building a better future together
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Our Users Say */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stories from creators and donors who use AlgoFund every day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border rounded-xl p-6 bg-card shadow-campaign">
              <p className="italic mb-4">“Funding our clean-water project was seamless. Fees were tiny and our supporters loved the instant confirmations.”</p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-semibold">Aarav S.</p>
                  <p className="text-muted-foreground">Creator • Community Wells</p>
                </div>
                <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">Raised 12,500 ALGO</span>
              </div>
            </div>
            <div className="border rounded-xl p-6 bg-card shadow-campaign">
              <p className="italic mb-4">“I can see where my donation goes on chain. The transparency gives me confidence to support more causes.”</p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-semibold">Meera T.</p>
                  <p className="text-muted-foreground">Donor • Verified</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Top Donor</span>
              </div>
            </div>
            <div className="border rounded-xl p-6 bg-card shadow-campaign">
              <p className="italic mb-4">“Launching on AlgoFund took minutes. Instant payouts and global reach helped us hit our goal quickly.”</p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-semibold">Luis R.</p>
                  <p className="text-muted-foreground">Creator • Open Education</p>
                </div>
                <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">100% Funded</span>
              </div>
            </div>
          </div>
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
      <footer className="border-t py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold">AlgoFund</span>
              </div>
              <p className="text-sm text-muted-foreground">Crowdfunding built on Algorand. Fast, secure, and transparent.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">FAQ</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Getting Started</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Security</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Fees</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Developers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://testnet.algoexplorer.io" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">Algorand Explorer</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">API Docs</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Changelog</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} AlgoFund. All rights reserved.
          </div>
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