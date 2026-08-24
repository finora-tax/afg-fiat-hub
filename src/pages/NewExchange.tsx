import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftRight, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const currencies = [{ value: "AFN", label: "AFN- افغانی" }, { value: "USD", label: "USD- دالر آمریکا" }];

const NewExchange = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate(); const { toast } = useToast(); const [isLoading, setIsLoading] = useState(false);
  const [customerType, setCustomerType] = useState<"temporary" | "permanent">("temporary");
  const [transactionType, setTransactionType] = useState<string>("");
  const [formData, setFormData] = useState({ date: new Date().toISOString().split("T")[0], name: "", tazkera: "", phone: "", address: "", purchasedCurrency: "", saleCurrency: "", purchasedAmount: "", marketRate: "", marketRatePercent: "", purchaseSaleRate: "", purchaseSaleRatePercent: "", saleAmount: "" });
  const [rates, setRates] = useState<any[]>([]);
  const purchasedAmount = Number(formData.purchasedAmount); const saleAmount = Number(formData.saleAmount); const exchangeRate = Number(formData.purchaseSaleRate);
  const hasValidAmounts = Number.isFinite(purchasedAmount) && purchasedAmount > 0 && Number.isFinite(saleAmount) && saleAmount > 0;
  const hasValidRate = Number.isFinite(exchangeRate) && exchangeRate > 0;
  const hasValidCurrencies = !!formData.purchasedCurrency && !!formData.saleCurrency && formData.purchasedCurrency !== formData.saleCurrency;

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);
  useEffect(() => { supabase.from("exchange_rates").select("*").then(({ data }) => { if (data) setRates(data); }); }, []);
  useEffect(() => {
    if (!hasValidCurrencies) { setFormData(prev => ({ ...prev, marketRate: "", purchaseSaleRate: "", saleAmount: "" })); return; }
    const rate = rates.find(r => r.from_currency === formData.saleCurrency && r.to_currency === formData.purchasedCurrency);
    if (rate && Number(rate.sell_rate) > 0) setFormData(prev => ({ ...prev, marketRate: String(rate.sell_rate), purchaseSaleRate: String(rate.sell_rate) }));
  }, [formData.purchasedCurrency, formData.saleCurrency, rates, hasValidCurrencies]);
  useEffect(() => { if (Number.isFinite(purchasedAmount) && purchasedAmount > 0 && hasValidRate) setFormData(prev => ({ ...prev, saleAmount: (purchasedAmount * exchangeRate).toFixed(2) })); else setFormData(prev => ({ ...prev, saleAmount: "" })); }, [formData.purchasedAmount, formData.purchaseSaleRate, purchasedAmount, exchangeRate, hasValidRate]);
  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    if (!formData.name.trim() || !transactionType || !hasValidCurrencies || !hasValidAmounts || !hasValidRate) {
      toast({ title: "خطا", description: "اطلاعات مشتری، نوع معامله، ارزها، مبلغ و نرخ معتبر را وارد کنید", variant: "destructive" }); return;
    }
    const expectedSaleAmount = purchasedAmount * exchangeRate;
    if (!Number.isFinite(expectedSaleAmount) || Math.abs(saleAmount - expectedSaleAmount) > 0.01) {
      toast({ title: "خطا", description: "مبلغ فروش با مبلغ و نرخ معامله مطابقت ندارد", variant: "destructive" }); return;
    }
    setIsLoading(true);
    const { error } = await supabase.from("transfers").insert({ user_id: user.id, transfer_type: "send", from_currency: formData.saleCurrency, to_currency: formData.purchasedCurrency, amount: saleAmount, converted_amount: purchasedAmount, exchange_rate: exchangeRate, fee: 0, sender_name: formData.name.trim(), sender_phone: formData.phone.trim() || null, notes: JSON.stringify({ type: "exchange", transactionType, customerType, date: formData.date, tazkera: formData.tazkera.trim(), address: formData.address.trim(), marketRate: Number(formData.marketRate) || null, marketRatePercent: Number(formData.marketRatePercent) || null, purchaseSaleRate: exchangeRate, purchaseSaleRatePercent: Number(formData.purchaseSaleRatePercent) || null }), status: "pending" });
    setIsLoading(false);
    if (error) { toast({ title: "خطا", description: "ثبت تبدیل ارز انجام نشد. لطفاً دوباره کوشش کنید", variant: "destructive" }); return; }
    toast({ title: "موفق", description: "تبدیل ارز با موفقیت ثبت شد" }); navigate("/transfers/pending");
  };
  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  return <div className="min-h-screen bg-background" dir="rtl"><Header /><main className="container mx-auto px-4 pt-24 pb-12"><div className="max-w-3xl mx-auto"><Button variant="ghost" className="mb-6" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 ml-2" />بازگشت</Button><Card className="border-border/50 bg-card/80 backdrop-blur-xl"><CardHeader className="text-center pb-2"><div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center mb-4"><ArrowLeftRight className="h-6 w-6 text-accent-foreground" /></div><CardTitle className="text-2xl">تبدیل ارز جدید</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-8">
  <div className="space-y-4"><div className="space-y-2"><Label>نوع مشتری</Label><RadioGroup value={customerType} onValueChange={(v) => setCustomerType(v as "temporary" | "permanent")} className="flex gap-6"><div className="flex items-center gap-2"><RadioGroupItem value="temporary" id="ct-temp" /><Label htmlFor="ct-temp" className="cursor-pointer">مشتری موقت</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="permanent" id="ct-perm" /><Label htmlFor="ct-perm" className="cursor-pointer">مشتری دایمی</Label></div></RadioGroup></div><div className="space-y-2 max-w-xs"><Label>تاریخ</Label><Input type="date" value={formData.date} onChange={(e) => updateField("date", e.target.value)} /></div></div><Separator />
  <div className="space-y-4"><h3 className="text-lg font-semibold text-foreground">اطلاعات مشتری</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>نام / نام پدر *</Label><Input placeholder="نام کامل" value={formData.name} onChange={(e) => updateField("name", e.target.value)} /></div><div className="space-y-2"><Label>تذکره / شماره شناسایی / جواز</Label><Input placeholder="شماره تذکره" value={formData.tazkera} onChange={(e) => updateField("tazkera", e.target.value)} /></div><div className="space-y-2"><Label>تلفن</Label><Input placeholder="شماره تماس" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} /></div><div className="space-y-2"><Label>آدرس</Label><Input placeholder="آدرس" value={formData.address} onChange={(e) => updateField("address", e.target.value)} /></div></div></div><Separator />
  <div className="space-y-4"><h3 className="text-lg font-semibold text-foreground">نوع معامله</h3><Select value={transactionType} onValueChange={setTransactionType}><SelectTrigger className="max-w-xs"><SelectValue placeholder="انتخاب نوع" /></SelectTrigger><SelectContent><SelectItem value="exchange">تبدیل ارز (Exchange)</SelectItem><SelectItem value="auction">حراج (Auction)</SelectItem></SelectContent></Select></div><Separator />
  <div className="space-y-4"><h3 className="text-lg font-semibold text-foreground">اطلاعات مالی</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>ارز خریداری شده</Label><Select value={formData.purchasedCurrency} onValueChange={(v) => updateField("purchasedCurrency", v)}><SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>ارز فروش</Label><Select value={formData.saleCurrency} onValueChange={(v) => updateField("saleCurrency", v)}><SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>مبلغ خرید *</Label><Input type="number" min="0" step="0.01" placeholder="0" value={formData.purchasedAmount} onChange={(e) => updateField("purchasedAmount", e.target.value)} className="font-mono text-lg" /></div><div className="space-y-2"><Label>مبلغ فروش</Label><Input type="number" placeholder="0" value={formData.saleAmount} readOnly className="font-mono text-lg bg-secondary/30 text-primary" /></div></div><div className="bg-secondary/20 rounded-xl p-4 space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-muted-foreground">نرخ بازار</Label><Input placeholder="نرخ" value={formData.marketRate} onChange={(e) => updateField("marketRate", e.target.value)} className="font-mono" /></div><div className="space-y-2"><Label className="text-muted-foreground">نرخ خرید/فروش</Label><Input type="number" min="0" step="0.000001" placeholder="نرخ" value={formData.purchaseSaleRate} onChange={(e) => updateField("purchaseSaleRate", e.target.value)} className="font-mono" /></div></div></div></div><Separator />
  <div className="bg-secondary/30 rounded-xl p-6 space-y-3"><h4 className="font-semibold text-foreground mb-3">خلاصه معامله</h4><div className="grid grid-cols-2 gap-y-2 text-sm"><span className="text-muted-foreground">مشتری:</span><span className="font-medium">{formData.name || "—"}</span><span className="text-muted-foreground">نوع:</span><span>{transactionType === "exchange" ? "تبدیل ارز" : transactionType === "auction" ? "حراج" : "—"}</span><span className="text-muted-foreground">خرید:</span><span className="font-mono">{formData.purchasedAmount || "0"} {formData.purchasedCurrency}</span><span className="text-muted-foreground">فروش:</span><span className="font-mono text-primary">{formData.saleAmount || "0"} {formData.saleCurrency}</span><span className="text-muted-foreground">نرخ:</span><span className="font-mono">{formData.purchaseSaleRate || "—"}</span></div></div>
  <Button type="submit" className="w-full" size="lg" disabled={isLoading || !formData.name.trim() || !transactionType || !hasValidCurrencies || !hasValidAmounts || !hasValidRate}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ArrowLeftRight className="h-4 w-4 ml-2" />}ثبت تبدیل ارز</Button>
</form></CardContent></Card></div></main></div>;
};
export default NewExchange;
