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

const currencies = [
  { value: "AFN", label: "AFN- افغانی" },
  { value: "USD", label: "USD- دلار آمریکا" },
];

const NewExchange = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [customerType, setCustomerType] = useState<"temporary" | "permanent">("temporary");
  const [transactionType, setTransactionType] = useState<string>("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    name: "",
    tazkera: "",
    phone: "",
    address: "",
    purchasedCurrency: "",
    saleCurrency: "",
    purchasedAmount: "",
    marketRate: "",
    marketRatePercent: "",
    purchaseSaleRate: "",
    purchaseSaleRatePercent: "",
    saleAmount: "",
  });

  const [rates, setRates] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchRates = async () => {
      const { data } = await supabase.from("exchange_rates").select("*");
      if (data) setRates(data);
    };
    fetchRates();
  }, []);

  // Auto-fill market rate when currencies change
  useEffect(() => {
    if (formData.purchasedCurrency && formData.saleCurrency) {
      const rate = rates.find(
        r => r.from_currency === formData.saleCurrency && r.to_currency === formData.purchasedCurrency
      );
      if (rate) {
        setFormData(prev => ({
          ...prev,
          marketRate: rate.sell_rate.toString(),
          purchaseSaleRate: rate.sell_rate.toString(),
        }));
      }
    }
  }, [formData.purchasedCurrency, formData.saleCurrency, rates]);

  // Auto-calculate sale amount
  useEffect(() => {
    if (formData.purchasedAmount && formData.purchaseSaleRate) {
      const amount = parseFloat(formData.purchasedAmount);
      const rate = parseFloat(formData.purchaseSaleRate);
      if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
        setFormData(prev => ({ ...prev, saleAmount: (amount * rate).toFixed(2) }));
      }
    }
  }, [formData.purchasedAmount, formData.purchaseSaleRate]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.purchasedCurrency || !formData.saleCurrency || !formData.purchasedAmount) {
      toast({ title: "خطا", description: "لطفاً تمام فیلدهای ضروری را پر کنید", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("transfers").insert({
      user_id: user.id,
      transfer_type: "send",
      from_currency: formData.saleCurrency,
      to_currency: formData.purchasedCurrency,
      amount: parseFloat(formData.saleAmount) || 0,
      converted_amount: parseFloat(formData.purchasedAmount),
      exchange_rate: parseFloat(formData.purchaseSaleRate) || 1,
      fee: 0,
      sender_name: formData.name,
      sender_phone: formData.phone,
      notes: JSON.stringify({
        type: "exchange",
        transactionType,
        customerType,
        tazkera: formData.tazkera,
        address: formData.address,
        marketRate: formData.marketRate,
        purchaseSaleRate: formData.purchaseSaleRate,
      }),
      status: "pending",
    });

    setIsLoading(false);

    if (error) {
      toast({ title: "خطا", description: "مشکلی در ثبت تبدیل ارز رخ داد", variant: "destructive" });
    } else {
      toast({ title: "موفق", description: "تبدیل ارز با موفقیت ثبت شد" });
      navigate("/transfers/pending");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center mb-4">
                <ArrowLeftRight className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">تبدیل ارز جدید</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Customer Type */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>نوع مشتری</Label>
                    <RadioGroup
                      value={customerType}
                      onValueChange={(v) => setCustomerType(v as "temporary" | "permanent")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="temporary" id="ct-temp" />
                        <Label htmlFor="ct-temp" className="cursor-pointer">مشتری موقت</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="permanent" id="ct-perm" />
                        <Label htmlFor="ct-perm" className="cursor-pointer">مشتری دایمی</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <Label>تاریخ</Label>
                    <Input type="date" value={formData.date} onChange={(e) => updateField("date", e.target.value)} />
                  </div>
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">اطلاعات مشتری</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نام / نام پدر *</Label>
                      <Input placeholder="نام کامل" value={formData.name} onChange={(e) => updateField("name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>تذکره / شماره شناسایی / جواز</Label>
                      <Input placeholder="شماره تذکره" value={formData.tazkera} onChange={(e) => updateField("tazkera", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>تلفن</Label>
                      <Input placeholder="شماره تماس" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>آدرس</Label>
                      <Input placeholder="آدرس" value={formData.address} onChange={(e) => updateField("address", e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Transaction Type */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">نوع معامله</h3>
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger className="max-w-xs"><SelectValue placeholder="انتخاب نوع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exchange">تبدیل ارز (Exchange)</SelectItem>
                      <SelectItem value="auction">حراج (Auction)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Currency & Amounts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">اطلاعات مالی</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ارز خریداری شده</Label>
                      <Select value={formData.purchasedCurrency} onValueChange={(v) => updateField("purchasedCurrency", v)}>
                        <SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>ارز فروش</Label>
                      <Select value={formData.saleCurrency} onValueChange={(v) => updateField("saleCurrency", v)}>
                        <SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>مبلغ خرید *</Label>
                      <Input type="number" placeholder="0" value={formData.purchasedAmount} onChange={(e) => updateField("purchasedAmount", e.target.value)} className="font-mono text-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label>مبلغ فروش</Label>
                      <Input type="number" placeholder="0" value={formData.saleAmount} readOnly className="font-mono text-lg bg-secondary/30 text-primary" />
                    </div>
                  </div>

                  <div className="bg-secondary/20 rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">نرخ بازار</Label>
                        <div className="flex gap-2">
                          <Input placeholder="نرخ" value={formData.marketRate} onChange={(e) => updateField("marketRate", e.target.value)} className="font-mono" />
                          <div className="flex items-center gap-1 px-3 bg-secondary rounded-md border border-border/50 min-w-[60px] justify-center">
                            <span className="text-sm text-muted-foreground">%</span>
                            <Input
                              placeholder="0"
                              value={formData.marketRatePercent}
                              onChange={(e) => updateField("marketRatePercent", e.target.value)}
                              className="border-0 bg-transparent p-0 h-auto text-sm font-mono w-12 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">نرخ خرید/فروش</Label>
                        <div className="flex gap-2">
                          <Input placeholder="نرخ" value={formData.purchaseSaleRate} onChange={(e) => updateField("purchaseSaleRate", e.target.value)} className="font-mono" />
                          <div className="flex items-center gap-1 px-3 bg-secondary rounded-md border border-border/50 min-w-[60px] justify-center">
                            <span className="text-sm text-muted-foreground">%</span>
                            <Input
                              placeholder="0"
                              value={formData.purchaseSaleRatePercent}
                              onChange={(e) => updateField("purchaseSaleRatePercent", e.target.value)}
                              className="border-0 bg-transparent p-0 h-auto text-sm font-mono w-12 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-secondary/30 rounded-xl p-6 space-y-3">
                  <h4 className="font-semibold text-foreground mb-3">خلاصه معامله</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">مشتری:</span>
                    <span className="font-medium">{formData.name || "—"}</span>
                    <span className="text-muted-foreground">نوع:</span>
                    <span>{transactionType === "exchange" ? "تبدیل ارز" : transactionType === "auction" ? "حراج" : "—"}</span>
                    <span className="text-muted-foreground">خرید:</span>
                    <span className="font-mono">{formData.purchasedAmount || "0"} {formData.purchasedCurrency}</span>
                    <span className="text-muted-foreground">فروش:</span>
                    <span className="font-mono text-primary">{formData.saleAmount || "0"} {formData.saleCurrency}</span>
                    <span className="text-muted-foreground">نرخ:</span>
                    <span className="font-mono">{formData.purchaseSaleRate || "—"}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ArrowLeftRight className="h-4 w-4 ml-2" />}
                  ثبت تبدیل ارز
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewExchange;
