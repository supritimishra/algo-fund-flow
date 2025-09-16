import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateCampaignProps {
  isConnected: boolean;
  onCampaignCreate?: (campaign: any) => void;
}

const CreateCampaign = ({ isConnected }: CreateCampaignProps) => {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => navigate('/create')}
      className="bg-gradient-success hover:opacity-90 shadow-fund"
    >
      <Plus className="mr-2 h-4 w-4" />
      Create Campaign
    </Button>
  );
};

export default CreateCampaign;