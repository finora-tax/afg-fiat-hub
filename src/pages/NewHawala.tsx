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
import { Send, ArrowLeft, Loader2, Globe, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const branches = [
  { value: "main", label: "شعبه مرکزی" },
  { value: "mazar", label: "مزار شریف" },
  { value: "herat", label: "هرات" },
  { value: "kunduz", label: "کندوز" },
  { value: "faryab", label: "فاریاب" },
  { value: "sheberghan", label: "شبرغان" },
  { value: "hairatan", label: "شعبه حیرتان" },
];

const currencies = [
  { value: "AFN", label: "AFN- افغانی" },
  { value: "USD", label: "USD- دلار آمریکا" },
];

const NewHawala = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [hawalaType, setHawalaType] = useState<"new" | "foreign">("new");
  const [principleCustomerType, setPrincipleCustomerType] = useState<"temporary" | "permanent">("temporary");
  const [beneficiaryCustomerType, setBeneficiaryCustomerType] = useState<"temporary" | "permanent">("temporary");
  const [commissionType, setCommissionType] = useState<"one_way" | "two_way">("one_way");

  const [formData, setFormData] = useState({
    toBranch: "",
    hawalaCode: "",
    hawalaNo: "",
    date: new Date().toISOString().split("T")[0],
    // Principle
    principleName: "",
    principleTazkera: "",
    principlePhone: "",
    principleAddress: "",
    // Beneficiary
    beneficiaryName: "",
    beneficiaryTazkera: "",
    beneficiaryPhone: "",
    beneficiaryAddress: "",
    // Currency
    sendCurrency: "",
    sendAmount: "",
    receiveCurrency: "",
    receiveAmount: "",
    // Commission
    commissionCurrency: "",
    senderCommission: "",
  });

  const [rates, setRates] = useState<any[]>([]);
  const [feeAmount, setFeeAmount] = useState(0);

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

  // Auto-calculate receive amount
  useEffect(() => {
    if (formData.sendAmount && formData.sendCurrency && formData.receiveCurrency) {
      if (formData.sendCurrency === formData.receiveCurrency) {
        setFormData(prev => ({ ...prev, receiveAmount: prev.sendAmount }));
        return;
      }
      const rate = rates.find(
        r => r.from_currency === formData.sendCurrency && r.to_currency === formData.receiveCurrency
      );
      if (rate) {
        const converted = parseFloat(formData.sendAmount) * rate.sell_rate;
        setFormData(prev => ({ ...prev, receiveAmount: converted.toFixed(2) }));
      }
    }
  }, [formData.sendAmount, formData.sendCurrency, formData.receiveCurrency, rates]);

  // Auto-calculate fee
  useEffect(() => {
    const fetchFee = async () => {
      if (!formData.sendAmount || parseFloat(formData.sendAmount) <= 0) { setFeeAmount(0); return; }
      const pair = `${formData.sendCurrency}-${formData.receiveCurrency}`;
      const { data } = await supabase.rpc("calculate_fee", { _currency_pair: pair, _amount: parseFloat(formData.sendAmount) });
      setFeeAmount(typeof data === "number" ? data : 0);
    };
    if (formData.sendCurrency && formData.receiveCurrency) fetchFee();
  }, [formData.sendAmount, formData.sendCurrency, formData.receiveCurrency]);

  // Auto-generate hawala code
  useEffect(() => {
    const code = `HW-${Date.now().toString(36).toUpperCase()}`;
    setFormData(prev => ({ ...prev, hawalaCode: code }));
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.principleName || !formData.beneficiaryName || !formData.sendAmount || !formData.sendCurrency || !formData.receiveCurrency) {
      toast({ title: "خطا", description: "لطفاً تمام فیلدهای ضروری را پر کنید", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const rate = rates.find(
      r => r.from_currency === formData.sendCurrency && r.to_currency === formData.receiveCurrency
    );

    const { error } = await supabase.from("transfers").insert({
      user_id: user.id,
      transfer_type: "send",
      from_currency: formData.sendCurrency,
      to_currency: formData.receiveCurrency,
      amount: parseFloat(formData.sendAmount),
      converted_amount: parseFloat(formData.receiveAmount) || 0,
      exchange_rate: rate?.sell_rate || 1,
      fee: feeAmount,
      sender_name: formData.principleName,
      sender_phone: formData.principlePhone,
      recipient_name: formData.beneficiaryName,
      recipient_phone: formData.beneficiaryPhone,
      recipient_account: formData.toBranch,
      notes: JSON.stringify({
        hawalaCode: formData.hawalaCode,
        hawalaNo: formData.hawalaNo,
        hawalaType,
        principleCustomerType,
        beneficiaryCustomerType,
        commissionType,
        commissionCurrency: formData.commissionCurrency,
        senderCommission: formData.senderCommission,
        principleTazkera: formData.principleTazkera,
        principleAddress: formData.principleAddress,
        beneficiaryTazkera: formData.beneficiaryTazkera,
        beneficiaryAddress: formData.beneficiaryAddress,
        toBranch: formData.toBranch,
      }),
      status: "pending",
    });

    setIsLoading(false);

    if (error) {
      toast({ title: "خطا", description: "مشکلی در ثبت حواله رخ داد", variant: "destructive" });
    } else {
      toast({ title: "موفق", description: "حواله با موفقیت ثبت شد" });
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
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">حواله جدید</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hawala Type Toggle */}
                <div className="flex gap-4 justify-center">
                  <Button
                    type="button"
                    variant={hawalaType === "new" ? "default" : "outline"}
                    onClick={() => setHawalaType("new")}
                    className="min-w-[120px]"
                  >
                    <Send className="h-4 w-4 ml-2" />
                    حواله جدید
                  </Button>
                  <Button
                    type="button"
                    variant={hawalaType === "foreign" ? "default" : "outline"}
                    onClick={() => setHawalaType("foreign")}
                    className="min-w-[120px]"
                  >
                    <Globe className="h-4 w-4 ml-2" />
                    حواله خارجی
                  </Button>
                </div>

                <Separator />

                {/* Principle Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">P</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">فرستنده (Principle)</h3>
                  </div>

                  <div className="space-y-2">
                    <Label>نوع مشتری</Label>
                    <RadioGroup
                      value={principleCustomerType}
                      onValueChange={(v) => setPrincipleCustomerType(v as "temporary" | "permanent")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="temporary" id="p-temp" />
                        <Label htmlFor="p-temp" className="cursor-pointer">موقت</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="permanent" id="p-perm" />
                        <Label htmlFor="p-perm" className="cursor-pointer">دایمی</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نام / نام پدر *</Label>
                      <Input placeholder="نام کامل" value={formData.principleName} onChange={(e) => updateField("principleName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>تذکره / شماره شناسایی / جواز</Label>
                      <Input placeholder="شماره تذکره یا شناسایی" value={formData.principleTazkera} onChange={(e) => updateField("principleTazkera", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>تلفن</Label>
                      <Input placeholder="شماره تماس" value={formData.principlePhone} onChange={(e) => updateField("principlePhone", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>آدرس</Label>
                      <Input placeholder="آدرس" value={formData.principleAddress} onChange={(e) => updateField("principleAddress", e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Beneficiary Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-accent font-bold text-sm">B</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">گیرنده (Beneficiary)</h3>
                  </div>

                  <div className="space-y-2">
                    <Label>نوع مشتری</Label>
                    <RadioGroup
                      value={beneficiaryCustomerType}
                      onValueChange={(v) => setBeneficiaryCustomerType(v as "temporary" | "permanent")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="temporary" id="b-temp" />
                        <Label htmlFor="b-temp" className="cursor-pointer">موقت</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="permanent" id="b-perm" />
                        <Label htmlFor="b-perm" className="cursor-pointer">دایمی</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نام / نام پدر *</Label>
                      <Input placeholder="نام کامل" value={formData.beneficiaryName} onChange={(e) => updateField("beneficiaryName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>تذکره / شماره شناسایی / جواز</Label>
                      <Input placeholder="شماره تذکره یا شناسایی" value={formData.beneficiaryTazkera} onChange={(e) => updateField("beneficiaryTazkera", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>تلفن</Label>
                      <Input placeholder="شماره تماس" value={formData.beneficiaryPhone} onChange={(e) => updateField("beneficiaryPhone", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>آدرس</Label>
                      <Input placeholder="آدرس" value={formData.beneficiaryAddress} onChange={(e) => updateField("beneficiaryAddress", e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Relationship / Branch */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">اطلاعات حواله</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>شعبه مقصد</Label>
                      <Select value={formData.toBranch} onValueChange={(v) => updateField("toBranch", v)}>
                        <SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger>
                        <SelectContent>
                          {branches.map(b => (
                            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>کد حواله</Label>
                      <Input value={formData.hawalaCode} readOnly className="bg-secondary/30 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>شماره حواله</Label>
                      <Input placeholder="شماره حواله" value={formData.hawalaNo} onChange={(e) => updateField("hawalaNo", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <Label>تاریخ</Label>
                    <Input type="date" value={formData.date} onChange={(e) => updateField("date", e.target.value)} />
                  </div>
                </div>

                <Separator />

                {/* Currency Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">ارز و مبلغ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ارز ارسالی</Label>
                      <Select value={formData.sendCurrency} onValueChange={(v) => updateField("sendCurrency", v)}>
                        <SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>مبلغ ارسالی *</Label>
                      <Input type="number" placeholder="0" value={formData.sendAmount} onChange={(e) => updateField("sendAmount", e.target.value)} className="font-mono text-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label>ارز دریافتی</Label>
                      <Select value={formData.receiveCurrency} onValueChange={(v) => updateField("receiveCurrency", v)}>
                        <SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>مبلغ دریافتی</Label>
                      <Input type="number" placeholder="0" value={formData.receiveAmount} readOnly className="font-mono text-lg bg-secondary/30 text-primary" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Commission Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">کمیشن</h3>

                  <div className="space-y-2">
                    <Label>نوع کمیشن</Label>
                    <RadioGroup
                      value={commissionType}
                      onValueChange={(v) => setCommissionType(v as "one_way" | "two_way")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="one_way" id="c-one" />
                        <Label htmlFor="c-one" className="cursor-pointer">یک طرفه</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="two_way" id="c-two" />
                        <Label htmlFor="c-two" className="cursor-pointer">دو طرفه</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ارز کمیشن</Label>
                      <Select value={formData.commissionCurrency} onValueChange={(v) => updateField("commissionCurrency", v)}>
                        <SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>کمیشن فرستنده</Label>
                      <Input type="number" placeholder="0" value={formData.senderCommission} onChange={(e) => updateField("senderCommission", e.target.value)} className="font-mono" />
                    </div>
                  </div>

                  {feeAmount > 0 && (
                    <div className="bg-secondary/30 rounded-xl p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">کارمزد محاسبه شده:</span>
                        <span className="font-mono text-accent">{feeAmount.toFixed(2)} {formData.sendCurrency}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-secondary/30 rounded-xl p-6 space-y-3">
                  <h4 className="font-semibold text-foreground mb-3">خلاصه حواله</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">فرستنده:</span>
                    <span className="font-medium">{formData.principleName || "—"}</span>
                    <span className="text-muted-foreground">گیرنده:</span>
                    <span className="font-medium">{formData.beneficiaryName || "—"}</span>
                    <span className="text-muted-foreground">مبلغ ارسالی:</span>
                    <span className="font-mono">{formData.sendAmount || "0"} {formData.sendCurrency}</span>
                    <span className="text-muted-foreground">مبلغ دریافتی:</span>
                    <span className="font-mono text-primary">{formData.receiveAmount || "0"} {formData.receiveCurrency}</span>
                    <span className="text-muted-foreground">شعبه:</span>
                    <span>{branches.find(b => b.value === formData.toBranch)?.label || "—"}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
                  ثبت حواله
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewHawala;
