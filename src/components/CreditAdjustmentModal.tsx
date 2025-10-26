'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, CreditCard, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
  balance: number;
  total_purchased: number;
  total_spent: number;
  is_admin: boolean;
}

interface CreditAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onComplete: () => void;
}

export function CreditAdjustmentModal({
  isOpen,
  onClose,
  user,
  onComplete
}: CreditAdjustmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    credits: '',
    reason: '',
    adjustment_type: 'adjust' as 'adjust' | 'refund'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.credits || !formData.reason) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const credits = parseInt(formData.credits);
    if (isNaN(credits) || credits === 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Credits must be a non-zero number.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/credits/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: user.id,
          credits,
          reason: formData.reason,
          adjustment_type: formData.adjustment_type
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: `Successfully ${formData.adjustment_type === 'refund' ? 'refunded' : 'adjusted'} ${Math.abs(credits)} credits for ${user.email}`,
        });

        // Reset form
        setFormData({
          credits: '',
          reason: '',
          adjustment_type: 'adjust'
        });

        onComplete();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to adjust credits',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast({
        title: 'Error',
        description: 'Failed to adjust credits. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubtractCredits = user ? user.balance > 0 : false;
  const isRefund = formData.adjustment_type === 'refund';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Adjustment
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{user.email}</div>
                {user.name && (
                  <div className="text-sm text-muted-foreground">{user.name}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {user.balance} credits
                  </Badge>
                  {user.is_admin && (
                    <Badge variant="secondary" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Adjustment Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustment_type">Type</Label>
                  <Select
                    value={formData.adjustment_type}
                    onValueChange={(value: 'adjust' | 'refund') =>
                      setFormData(prev => ({ ...prev, adjustment_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adjust">Adjust</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">
                    Credits {isRefund ? '(Positive)' : '(±)'}
                  </Label>
                  <Input
                    id="credits"
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData(prev => ({ ...prev, credits: e.target.value }))}
                    placeholder={isRefund ? "100" : "50 or -25"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Describe why you're making this adjustment..."
                  rows={3}
                  required
                />
              </div>

              {/* Warnings */}
              {formData.credits && parseInt(formData.credits) < 0 && !canSubtractCredits && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <div className="text-sm text-destructive">
                    Cannot subtract credits from a user with zero balance.
                  </div>
                </div>
              )}

              {isRefund && parseInt(formData.credits) < 0 && (
                <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                  <div className="text-sm text-warning">
                    Refunds should be positive amounts (credits to add back).
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (formData.credits && parseInt(formData.credits) < 0 && !canSubtractCredits)}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isRefund ? 'Process Refund' : 'Adjust Credits'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
