import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/audit";

interface Tier {
  min_amount: number;
  max_amount: number | null;
  percentage: number;
}

interface FeeConfig {
  id: string;
  currency_pair: string;
  fee_type: string;
  fixed_fee: number;
  percentage_fee: number;
  tiers: Tier[];
  min_fee: number;
  max_fee: number | null;
  is_active: boolean;
}

export const FeeManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [configs, setConfigs] = useState<FeeConfig[]>([]);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("fee_configs").select("*").order("currency_pair");
    if (error) { toast.error("خطا در دریافت تنظیمات کارمزد"); }
    else if (data) {
      setConfigs(data.map(d => ({
        ...d,
        tiers: Array.isArray(d.tiers) ? (d.tiers as unknown as Tier[]) : [],
        fixed_fee: d.fixed_fee ?? 0,
        percentage_fee: d.percentage_fee ?? 0,
        min_fee: d.min_fee ?? 0,
        max_fee: d.max_fee ?? null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchConfigs(); }, []);

  const updateConfig = (id: string, field: string, value: any) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addTier = (id: string) => {
    setConfigs(prev => prev.map(c => {
      if (c.id !== id) return c;
      const lastMax = c.tiers.length > 0 ? (c.tiers[c.tiers.length - 1].max_amount || 0) : 0;
      return { ...c, tiers: [...c.tiers, { min_amount: lastMax, max_amount: null, percentage: 1 }] };
    }));
  };

  const removeTier = (id: string, idx: number) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, tiers: c.tiers.filter((_, i) => i !== idx) } : c));
  };

  const updateTier = (id: string, idx: number, field: string, value: number | null) => {
    setConfigs(prev => prev.map(c => {
      if (c.id !== id) return c;
      const tiers = [...c.tiers];
      tiers[idx] = { ...tiers[idx], [field]: value };
      return { ...c, tiers };
    }));
  };

  const saveConfig = async (config: FeeConfig) => {
    if (!user) return;
    setSaving(config.id);

    const { error } = await supabase.from("fee_configs").update({
      fee_type: config.fee_type,
      fixed_fee: config.fixed_fee,
      percentage_fee: config.percentage_fee,
      tiers: config.tiers as any,
      min_fee: config.min_fee,
      max_fee: config.max_fee,
      is_active: config.is_active,
      updated_by: user.id,
    }).eq("id", config.id);

    if (error) {
      toast.error("خطا در ذخیره");
    } else {
      toast.success(`کارمزد ${config.currency_pair} ذخیره شد`);
      await logAuditEvent({
        action: "fee_config_update",
        entity_type: "fee_config",
        entity_id: config.id,
        details: { currency_pair: config.currency_pair, fee_type: config.fee_type },
      });
    }
    setSaving(null);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">مدیریت کارمزد</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configs.map((config) => (
          <Card key={config.id} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{config.currency_pair}</CardTitle>
                <Badge variant={config.is_active ? "default" : "secondary"}>
                  {config.is_active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نوع کارمزد</Label>
                <Select value={config.fee_type} onValueChange={(v) => updateConfig(config.id, "fee_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">ثابت</SelectItem>
                    <SelectItem value="percentage">درصدی</SelectItem>
                    <SelectItem value="tiered">پلکانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.fee_type === "fixed" && (
                <div className="space-y-2">
                  <Label>مبلغ ثابت</Label>
                  <Input type="number" value={config.fixed_fee} onChange={(e) => updateConfig(config.id, "fixed_fee", parseFloat(e.target.value) || 0)} className="font-mono" dir="ltr" />
                </div>
              )}

              {config.fee_type === "percentage" && (
                <div className="space-y-2">
                  <Label>درصد کارمزد (%)</Label>
                  <Input type="number" value={config.percentage_fee} onChange={(e) => updateConfig(config.id, "percentage_fee", parseFloat(e.target.value) || 0)} className="font-mono" dir="ltr" step="0.1" />
                </div>
              )}

              {config.fee_type === "tiered" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>پله‌های کارمزد</Label>
                    <Button variant="outline" size="sm" onClick={() => addTier(config.id)}>
                      <Plus className="h-3 w-3 ml-1" />افزودن
                    </Button>
                  </div>
                  {config.tiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/20">
                      <Input type="number" value={tier.min_amount} onChange={(e) => updateTier(config.id, idx, "min_amount", parseFloat(e.target.value) || 0)} className="font-mono text-sm" dir="ltr" placeholder="حداقل" />
                      <span className="text-muted-foreground text-sm">تا</span>
                      <Input type="number" value={tier.max_amount ?? ""} onChange={(e) => updateTier(config.id, idx, "max_amount", e.target.value ? parseFloat(e.target.value) : null)} className="font-mono text-sm" dir="ltr" placeholder="بدون حد" />
                      <Input type="number" value={tier.percentage} onChange={(e) => updateTier(config.id, idx, "percentage", parseFloat(e.target.value) || 0)} className="font-mono text-sm w-20" dir="ltr" placeholder="%" step="0.1" />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTier(config.id, idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">حداقل کارمزد</Label>
                  <Input type="number" value={config.min_fee} onChange={(e) => updateConfig(config.id, "min_fee", parseFloat(e.target.value) || 0)} className="font-mono text-sm" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">حداکثر کارمزد</Label>
                  <Input type="number" value={config.max_fee ?? ""} onChange={(e) => updateConfig(config.id, "max_fee", e.target.value ? parseFloat(e.target.value) : null)} className="font-mono text-sm" dir="ltr" placeholder="بدون حد" />
                </div>
              </div>

              <Button className="w-full" onClick={() => saveConfig(config)} disabled={saving === config.id}>
                {saving === config.id ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                ذخیره
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
