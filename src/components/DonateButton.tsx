import { Button } from '@/components/ui/button';
import { HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DonateButton = () => {
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate('/donate')} className="bg-gradient-fund hover:opacity-90 shadow-fund">
      <HeartHandshake className="mr-2 h-4 w-4" />
      Donate
    </Button>
  );
};

export default DonateButton;


