import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  sell_rate: number;
}

const SendTransfer = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [formData, setFormData] = useState({
    fromCurrency: "AFN", toCurrency: "USD", amount: "",
    recipientName: "", recipientPhone: "", recipientAccount: "", notes: "",
  });
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [currentRate, setCurrentRate] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);

  const amount = Number(formData.amount);
  const hasValidAmount = Number.isFinite(amount) && amount > 0;
  const hasValidPair = formData.fromCurrency !== formData.toCurrency && currentRate > 0;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchRates = async () => {
      const { data, error } = await supabase.from("exchange_rates").select("from_currency, to_currency, sell_rate");
      if (!error && data) setRates(data);
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const rate = rates.find((r) => r.from_currency === formData.fromCurrency && r.to_currency === formData.toCurrency);
    if (rate && hasValidAmount && formData.fromCurrency !== formData.toCurrency) {
      const value = Number(rate.sell_rate);
      setCurrentRate(value);
      setConvertedAmount(amount * value);
    } else {
      setCurrentRate(0);
      setConvertedAmount(0);
    }
  }, [amount, hasValidAmount, formData.fromCurrency, formData.toCurrency, rates]);

  useEffect(() => {
    const fetchFee = async () => {
      if (!hasValidAmount || formData.fromCurrency === formData.toCurrency) {
        setFeeAmount(0);
        return;
      }
      const pair = `${formData.fromCurrency}-${formData.toCurrency}`;
      const { data, error } = await supabase.rpc("calculate_fee", { _currency_pair: pair, _amount: amount });
      setFeeAmount(!error && typeof data === "number" && Number.isFinite(data) && data >= 0 ? data : 0);
    };
    fetchFee();
  }, [amount, hasValidAmount, formData.fromCurrency, formData.toCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!hasValidAmount || !formData.recipientName.trim() || !formData.recipientPhone.trim()) {
      toast({ title: "خطا", description: "لطفاً مبلغ معتبر و اطلاعات ضروری گیرنده را وارد کنید", variant: "destructive" });
      return;
    }
    if (!hasValidPair || !Number.isFinite(convertedAmount) || convertedAmount <= 0) {
      toast({ title: "خطا", description: "برای این جفت ارز نرخ معتبر موجود نیست", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("transfers").insert({
      user_id: user.id,
      transfer_type: "send",
      from_currency: formData.fromCurrency,
      to_currency: formData.toCurrency,
      amount,
      converted_amount: convertedAmount,
      exchange_rate: currentRate,
      fee: feeAmount,
      recipient_name: formData.recipientName.trim(),
      recipient_phone: formData.recipientPhone.trim(),
      recipient_account: formData.recipientAccount.trim() || null,
      notes: formData.notes.trim() || null,
      status: "pending",
    });
    setIsLoading(false);

    if (error) {
      toast({ title: "خطا", description: "ثبت حواله انجام نشد. لطفاً دوباره کوشش کنید", variant: "destructive" });
      return;
    }
    toast({ title: "موفق", description: "حواله با موفقیت ثبت شد" });
    navigate("/transfers/pending");
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 ml-2" />بازگشت</Button>
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mb-4"><Send className="h-6 w-6 text-primary-foreground" /></div>
              <CardTitle className="text-2xl">ارسال حواله</CardTitle>
              <CardDescription>ثبت حواله با نرخ و کارمزد معتبر</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>از ارز</Label><Select value={formData.fromCurrency} onValueChange={(value) => setFormData({ ...formData, fromCurrency: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AFN">افغانی (AFN)</SelectItem><SelectItem value="USD">دالر (USD)</SelectItem><SelectItem value="EUR">یورو (EUR)</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>به ارز</Label><Select value={formData.toCurrency} onValueChange={(value) => setFormData({ ...formData, toCurrency: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AFN">افغانی (AFN)</SelectItem><SelectItem value="USD">دالر (USD)</SelectItem><SelectItem value="EUR">یورو (EUR)</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>مبلغ</Label><Input type="number" min="0" step="0.01" placeholder="مبلغ را وارد کنید" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="text-lg" />{hasValidAmount && !hasValidPair && <p className="text-sm text-destructive">برای این جفت ارز نرخ معتبر موجود نیست.</p>}{hasValidPair && <p className="text-sm text-muted-foreground">معادل: <span className="text-primary font-mono">{convertedAmount.toFixed(2)} {formData.toCurrency}</span> | نرخ: <span className="font-mono">{currentRate}</span></p>}</div>
                <div className="border-t border-border/50 pt-6"><h3 className="font-semibold mb-4">اطلاعات گیرنده</h3><div className="space-y-4"><div className="space-y-2"><Label>نام گیرنده *</Label><Input value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} /></div><div className="space-y-2"><Label>شماره تماس گیرنده *</Label><Input value={formData.recipientPhone} onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })} /></div><div className="space-y-2"><Label>شماره حساب گیرنده</Label><Input value={formData.recipientAccount} onChange={(e) => setFormData({ ...formData, recipientAccount: e.target.value })} /></div><div className="space-y-2"><Label>توضیحات</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div></div></div>
                <div className="bg-secondary/30 rounded-xl p-4"><div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">مبلغ ارسالی:</span><span className="font-mono">{hasValidAmount ? amount.toFixed(2) : "0.00"} {formData.fromCurrency}</span></div><div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">کارمزد:</span><span className="font-mono">{feeAmount.toFixed(2)} {formData.fromCurrency}</span></div><div className="flex justify-between font-semibold pt-2 border-t border-border/50"><span>مبلغ دریافتی گیرنده:</span><span className="text-primary font-mono">{convertedAmount.toFixed(2)} {formData.toCurrency}</span></div></div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading || !hasValidAmount || !hasValidPair}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}ثبت حواله</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SendTransfer;
