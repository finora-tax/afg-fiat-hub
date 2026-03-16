import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Save, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/audit";

export const RateManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState({
    usdBuy: "", usdSell: "", eurBuy: "", eurSell: "", irrBuy: "", irrSell: "",
  });

  const fetchRates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("exchange_rates").select("*");
    if (error) { toast.error("خطا در دریافت نرخ‌ها"); setLoading(false); return; }
    if (data) {
      const newRates = { ...rates };
      data.forEach((rate) => {
        if (rate.from_currency === "USD" && rate.to_currency === "AFN") { newRates.usdBuy = String(rate.buy_rate); newRates.usdSell = String(rate.sell_rate); }
        else if (rate.from_currency === "EUR" && rate.to_currency === "AFN") { newRates.eurBuy = String(rate.buy_rate); newRates.eurSell = String(rate.sell_rate); }
        else if (rate.from_currency === "IRR" && rate.to_currency === "AFN") { newRates.irrBuy = String(rate.buy_rate); newRates.irrSell = String(rate.sell_rate); }
      });
      setRates(newRates);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  const handleSaveRates = async () => {
    if (!user) return;
    const rateValues = [
      { key: "usdBuy", val: rates.usdBuy }, { key: "usdSell", val: rates.usdSell },
      { key: "eurBuy", val: rates.eurBuy }, { key: "eurSell", val: rates.eurSell },
      { key: "irrBuy", val: rates.irrBuy }, { key: "irrSell", val: rates.irrSell },
    ];
    for (const r of rateValues) {
      const num = parseFloat(r.val);
      if (isNaN(num) || num <= 0 || !isFinite(num)) { toast.error("تمام نرخ‌ها باید اعداد مثبت باشند"); return; }
    }

    setSaving(true);
    const upserts = [
      { from_currency: "USD", to_currency: "AFN", buy_rate: parseFloat(rates.usdBuy), sell_rate: parseFloat(rates.usdSell) },
      { from_currency: "EUR", to_currency: "AFN", buy_rate: parseFloat(rates.eurBuy), sell_rate: parseFloat(rates.eurSell) },
      { from_currency: "IRR", to_currency: "AFN", buy_rate: parseFloat(rates.irrBuy), sell_rate: parseFloat(rates.irrSell) },
    ];

    let hasError = false;
    for (const u of upserts) {
      const { error } = await supabase.from("exchange_rates")
        .update({ buy_rate: u.buy_rate, sell_rate: u.sell_rate, updated_by: user.id })
        .eq("from_currency", u.from_currency).eq("to_currency", u.to_currency);
      if (error) { hasError = true; }
    }

    if (hasError) {
      toast.error("خطا در ذخیره نرخ‌ها");
    } else {
      toast.success("نرخ‌ها با موفقیت ذخیره شدند");
      await logAuditEvent({
        action: "rate_update",
        entity_type: "exchange_rate",
        details: { usd: { buy: rates.usdBuy, sell: rates.usdSell }, eur: { buy: rates.eurBuy, sell: rates.eurSell }, irr: { buy: rates.irrBuy, sell: rates.irrSell } },
      });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const RateCard = ({ flag, name, code, buyKey, sellKey, step }: { flag: string; name: string; code: string; buyKey: keyof typeof rates; sellKey: keyof typeof rates; step?: string }) => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><span className="text-2xl">{flag}</span>{name} ({code})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4 text-primary" />نرخ خرید (AFN)</Label>
          <Input type="number" value={rates[buyKey]} onChange={(e) => setRates({ ...rates, [buyKey]: e.target.value })} className="text-left font-mono" dir="ltr" min="0.0001" step={step} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground"><TrendingDown className="h-4 w-4 text-destructive" />نرخ فروش (AFN)</Label>
          <Input type="number" value={rates[sellKey]} onChange={(e) => setRates({ ...rates, [sellKey]: e.target.value })} className="text-left font-mono" dir="ltr" min="0.0001" step={step} />
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">اسپرد: <span className="text-accent font-mono">{(parseFloat(rates[sellKey] || "0") - parseFloat(rates[buyKey] || "0")).toFixed(step === "0.0001" ? 4 : 2)} AFN</span></p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">مدیریت نرخ ارز</h2>
        <Button variant="outline" size="sm" onClick={fetchRates}><RefreshCw className="h-4 w-4 ml-2" />بازنشانی</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RateCard flag="🇺🇸" name="دلار آمریکا" code="USD" buyKey="usdBuy" sellKey="usdSell" />
        <RateCard flag="🇪🇺" name="یورو" code="EUR" buyKey="eurBuy" sellKey="eurSell" />
        <RateCard flag="🇮🇷" name="ریال ایران" code="IRR" buyKey="irrBuy" sellKey="irrSell" step="0.0001" />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSaveRates} className="bg-primary hover:bg-primary/90" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}ذخیره نرخ‌ها
        </Button>
      </div>
    </div>
  );
};
