import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Campaign, mockCampaigns } from '@/services/algorand';

interface CampaignStoreValue {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  addDonation: (campaignId: string, donorAddress: string, amount: number) => void;
  getCampaign: (id: string) => Campaign | undefined;
  // Reward/token helpers
  getTokenBalance: (address: string) => number;
  addReward: (address: string, tokens: number) => void;
}

const CampaignStoreContext = createContext<CampaignStoreValue | undefined>(undefined);

export const CampaignStoreProvider = ({ children }: { children: ReactNode }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    mockCampaigns.map(c => ({ ...c, donors: c.donors || [] }))
  );
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});

  const addCampaign = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  };

  const addDonation = (campaignId: string, donorAddress: string, amount: number) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      const donors = (c.donors || []).map(d => ({ address: String(d.address), amount: Number(d.amount) || 0 }));
      const donationAmt = Number(amount) || 0;
      const normAddr = String(donorAddress || '').trim();

      // Merge donation into donors list
      let found = false;
      const merged = donors.map(d => {
        if (d.address === normAddr) {
          found = true;
          const newAmt = Number((d.amount + donationAmt).toFixed(6));
          return { ...d, amount: newAmt };
        }
        return d;
      });
      if (!found) merged.push({ address: normAddr, amount: Number(donationAmt.toFixed(6)) });

      const updatedRaised = Number((c.raisedAmount + donationAmt).toFixed(6));
      const updated = {
        ...c,
        donors: merged,
        raisedAmount: updatedRaised,
      };
      try { console.debug('[CampaignStore] addDonation:', { campaignId, donorAddress: normAddr, amount: donationAmt, updated }); } catch (_) {}
      // Award tokens for donations: 1 token per ALGO (rounded down)
      try {
        const tokens = Math.floor(donationAmt);
        if (tokens > 0) setTokenBalances(tb => ({ ...tb, [normAddr]: (tb[normAddr] || 0) + tokens }));
      } catch (_) {}
      return updated;
    }));
  };

  const addReward = (address: string, tokens: number) => {
    if (!address || !tokens) return;
    setTokenBalances(tb => ({ ...tb, [address]: (tb[address] || 0) + tokens }));
  };

  const getTokenBalance = (address: string) => {
    return tokenBalances[address] || 0;
  };

  const getCampaign = (id: string) => campaigns.find(c => c.id === id);

  const value = useMemo(() => ({ campaigns, addCampaign, addDonation, getCampaign, getTokenBalance, addReward }), [campaigns, tokenBalances]);

  return (
    <CampaignStoreContext.Provider value={value}>{children}</CampaignStoreContext.Provider>
  );
};

export const useCampaignStore = (): CampaignStoreValue => {
  const ctx = useContext(CampaignStoreContext);
  if (!ctx) throw new Error('useCampaignStore must be used within CampaignStoreProvider');
  return ctx;
};


