import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Donor {
  address: string;
  amount: number;
}

interface LeaderboardProps {
  donors: Donor[];
}

const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const Leaderboard = ({ donors }: LeaderboardProps) => {
  const top = [...donors]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Donors</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No donations yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {top.map((d, i) => (
              <div key={d.address + i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium">{shorten(d.address)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(i < 5) && (
                    <Badge className="bg-gradient-success">Bounty</Badge>
                  )}
                  <span className="text-sm font-semibold">{d.amount.toLocaleString()} ALGO</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;


