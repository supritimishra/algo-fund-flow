import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface DonationSectionProps {
  onDonate: (amount: number) => Promise<void> | void;
  max?: number;
  disabled?: boolean;
}

const DonationSection = ({ onDonate, max, disabled }: DonationSectionProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setLoading(true);
    try {
      await onDonate(value);
      setAmount('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Donate ALGO
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="donation">Amount (ALGO)</Label>
          <Input id="donation" type="number" step="0.01" min="0.01" max={max} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          {max !== undefined && (
            <p className="text-xs text-muted-foreground">Max: {max.toFixed(2)} ALGO</p>
          )}
        </div>
        <div className="pt-3">
          <Button onClick={handleDonate} className="bg-gradient-fund" disabled={disabled || loading || !amount}>
            {loading ? 'Processing...' : `Donate ${amount || '0'} ALGO`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationSection;


