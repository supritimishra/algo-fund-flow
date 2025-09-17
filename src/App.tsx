import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider, useWallet } from '@txnlab/use-wallet-react';
import { walletManager } from '@/services/algorand';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Create from "./pages/Create";
import { CampaignStoreProvider } from '@/store/CampaignStore';
import CampaignPage from './pages/Campaign';
import DonatePage from './pages/Donate';
import LeaderboardPage from './pages/Leaderboard';
import ProfilePage from './pages/Profile';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider manager={walletManager}>
      <CampaignStoreProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/create" element={<Create />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/campaign/:id" element={<CampaignPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CampaignStoreProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;