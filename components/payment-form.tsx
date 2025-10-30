'use client';

import type React from "react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Loader2 } from "lucide-react";
import { createClient } from '@/utils/supabase';

interface PaymentFormProps {
  amount: number;
  planId: string;
  onPaymentSuccess: (reference: string) => void;
  onPaymentError: (error: string) => void;
}

export function PaymentForm({ amount, planId, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    currency: "USD",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount,
          user_id: user.id,
          planId,
        }),
      });

      const result = await response.json();

      if (result.status === "success" && result.data?.link) {
        // Redirect to Flutterwave payment page
        window.location.href = result.data.link;
      } else {
        onPaymentError(result.message || "Payment initialization failed");
      }
    } catch (error) {
      onPaymentError("Payment initialization error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Total Amount:</span>
              <span className="text-2xl font-bold">
                {formData.currency} {amount}
              </span>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formData.currency} ${amount}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
