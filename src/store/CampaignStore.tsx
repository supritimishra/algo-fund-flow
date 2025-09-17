import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Campaign, mockCampaigns } from '@/services/algorand';

interface CampaignStoreValue {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  addDonation: (campaignId: string, donorAddress: string, amount: number) => void;
  getCampaign: (id: string) => Campaign | undefined;
}

const CampaignStoreContext = createContext<CampaignStoreValue | undefined>(undefined);

export const CampaignStoreProvider = ({ children }: { children: ReactNode }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    mockCampaigns.map(c => ({ ...c, donors: c.donors || [] }))
  );

  const addCampaign = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  };

  const addDonation = (campaignId: string, donorAddress: string, amount: number) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      const donors = c.donors || [];
      const existing = donors.find(d => d.address === donorAddress);
      const updatedDonors = existing
        ? donors.map(d => d.address === donorAddress ? { ...d, amount: d.amount + amount } : d)
        : [...donors, { address: donorAddress, amount }];
      const updated = {
        ...c,
        donors: updatedDonors,
        raisedAmount: c.raisedAmount + amount,
      };
      try { console.debug('[CampaignStore] addDonation:', campaignId, donorAddress, amount, 'updated:', updated); } catch (_) {}
      return updated;
    }));
  };

  const getCampaign = (id: string) => campaigns.find(c => c.id === id);

  const value = useMemo(() => ({ campaigns, addCampaign, addDonation, getCampaign }), [campaigns]);

  return (
    <CampaignStoreContext.Provider value={value}>{children}</CampaignStoreContext.Provider>
  );
};

export const useCampaignStore = (): CampaignStoreValue => {
  const ctx = useContext(CampaignStoreContext);
  if (!ctx) throw new Error('useCampaignStore must be used within CampaignStoreProvider');
  return ctx;
};


