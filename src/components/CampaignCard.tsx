import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Campaign } from '@/services/algorand';
import { Calendar, Target, Wallet, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CampaignCardProps {
  campaign: Campaign;
  onFund: (campaign: Campaign) => void;
  isConnected: boolean;
}

const CampaignCard = ({ campaign, onFund, isConnected }: CampaignCardProps) => {
  const progressPercentage = (campaign.raisedAmount / campaign.goalAmount) * 100;
  const isDeadlinePassed = new Date() > campaign.deadline;
  const timeRemaining = formatDistanceToNow(campaign.deadline, { addSuffix: true });

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="group hover:shadow-campaign transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          {campaign.isActive && (
            <Badge variant="secondary" className="bg-success text-white">
              Active
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2">{campaign.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            style={{
              background: `linear-gradient(to right, hsl(var(--fund-progress)) ${progressPercentage}%, hsl(var(--muted)) ${progressPercentage}%)`
            }}
          />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-fund-progress">
              {campaign.raisedAmount.toLocaleString()} ALGO
            </span>
            <span className="text-muted-foreground">
              of {campaign.goalAmount.toLocaleString()} ALGO
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {isDeadlinePassed ? 'Ended' : 'Ends'}
              </p>
              <p className={`text-xs ${isDeadlinePassed ? 'text-destructive' : 'text-muted-foreground'}`}>
                {timeRemaining}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Creator</p>
              <p className="text-xs text-muted-foreground">
                {truncateAddress(campaign.creator)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          onClick={() => onFund(campaign)}
          disabled={!isConnected || !campaign.isActive || isDeadlinePassed}
          className="flex-1 bg-gradient-fund hover:opacity-90 shadow-fund"
        >
          <Target className="mr-2 h-4 w-4" />
          Fund Campaign
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://testnet.algoexplorer.io/address/${campaign.creator}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CampaignCard;