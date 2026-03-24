import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/audit";

interface Transfer {
  id: string;
  user_id: string;
  transfer_type: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  converted_amount: number;
  exchange_rate: number;
  fee: number | null;
  recipient_name: string | null;
  sender_name: string | null;
  status: string;
  created_at: string;
}

export const TransferManagement = () => {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transfers")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (data) setTransfers(data as Transfer[]);
    setLoading(false);
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleSettle = async (transfer: Transfer, action: "completed" | "cancelled") => {
    setProcessing(transfer.id);

    const { error } = await supabase.rpc("settle_transfer", {
      _transfer_id: transfer.id,
      _new_status: action,
    });

    if (error) {
      toast.error(error.message || "خطا در پردازش");
    } else {
      toast.success(action === "completed" ? "حواله تأیید و تسویه شد" : "حواله رد شد");
      await logAuditEvent({
        action: `transfer_${action}`,
        entity_type: "transfer",
        entity_id: transfer.id,
        details: { amount: transfer.amount, from: transfer.from_currency, to: transfer.to_currency, action },
      });
      fetchTransfers();
    }
    setProcessing(null);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">مدیریت حواله‌ها</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            حواله‌های در انتظار ({transfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">حواله‌ای در انتظار نیست</p>
          ) : (
            <div className="space-y-3">
              {transfers.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/30">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={t.transfer_type === "send" ? "default" : "secondary"}>
                        {t.transfer_type === "send" ? "ارسال" : "دریافت"}
                      </Badge>
                      <span className="font-mono font-bold">
                        {t.amount.toLocaleString()} {t.from_currency} → {t.converted_amount.toLocaleString()} {t.to_currency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.transfer_type === "send" ? `گیرنده: ${t.recipient_name}` : `فرستنده: ${t.sender_name}`}
                      {t.fee ? ` | کارمزد: ${t.fee}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("fa-IR")} | نرخ: {t.exchange_rate}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-400/30" onClick={() => handleSettle(t, "completed")} disabled={processing === t.id}>
                      {processing === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 ml-1" />}
                      تأیید و تسویه
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleSettle(t, "cancelled")} disabled={processing === t.id}>
                      <XCircle className="h-4 w-4 ml-1" />
                      رد
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
