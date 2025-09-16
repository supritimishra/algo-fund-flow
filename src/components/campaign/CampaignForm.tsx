import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Image as ImageIcon } from 'lucide-react';

export interface CampaignFormValues {
  title: string;
  description: string;
  goalAmount: string;
  deadline: string;
  imageUrl: string;
}

interface CampaignFormProps {
  initial?: CampaignFormValues;
  onSubmit: (values: CampaignFormValues) => Promise<void> | void;
  submitLabel?: string;
  disabled?: boolean;
}

const CampaignForm = ({ initial, onSubmit, submitLabel = 'Create Campaign', disabled }: CampaignFormProps) => {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CampaignFormValues>(
    initial || { title: '', description: '', goalAmount: '', deadline: '', imageUrl: '' }
  );

  const onChange = (key: keyof CampaignFormValues, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await onSubmit(form);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" /> Campaign Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => onChange('title', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => onChange('description', e.target.value)} rows={5} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Goal (ALGO)</Label>
              <Input id="goal" type="number" min="1" step="0.01" value={form.goalAmount} onChange={(e) => onChange('goalAmount', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" min={new Date().toISOString().split('T')[0]} value={form.deadline} onChange={(e) => onChange('deadline', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Upload Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => onChange('imageUrl', String(reader.result || ''));
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">Preview</div>
          </div>
          <div className="pt-2">
            <Button type="submit" className="bg-gradient-success" disabled={disabled || creating}>
              {creating ? 'Processing...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CampaignForm;


