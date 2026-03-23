import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/audit";

interface WalletTx {
  id: string;
  user_id: string;
  wallet_id: string;
  type: string;
  amount: number;
  status: string;
  method: string;
  notes: string | null;
  created_at: string;
}

interface WalletInfo {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
}

export const WalletManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingTxs, setPendingTxs] = useState<WalletTx[]>([]);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [txRes, walletsRes] = await Promise.all([
      supabase.from("wallet_transactions").select("*").eq("status", "pending").order("created_at", { ascending: true }),
      supabase.from("wallets").select("*"),
    ]);
    if (txRes.data) setPendingTxs(txRes.data as WalletTx[]);
    if (walletsRes.data) setWallets(walletsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (tx: WalletTx, action: "approved" | "rejected") => {
    if (!user) return;
    setProcessing(tx.id);

    if (action === "approved") {
      // Update wallet balance
      const wallet = wallets.find(w => w.id === tx.wallet_id);
      if (!wallet) { toast.error("کیف پول یافت نشد"); setProcessing(null); return; }

      const newBalance = tx.type === "deposit" 
        ? wallet.balance + tx.amount 
        : wallet.balance - tx.amount;

      if (newBalance < 0) {
        toast.error("موجودی کافی نیست");
        setProcessing(null);
        return;
      }

      const { error: walletErr } = await supabase.from("wallets")
        .update({ balance: newBalance })
        .eq("id", tx.wallet_id);

      if (walletErr) {
        toast.error("خطا در به‌روزرسانی موجودی");
        setProcessing(null);
        return;
      }
    }

    const { error } = await supabase.from("wallet_transactions")
      .update({ status: action, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", tx.id);

    if (error) {
      toast.error("خطا در پردازش");
    } else {
      toast.success(action === "approved" ? "تأیید شد" : "رد شد");
      await logAuditEvent({
        action: `wallet_tx_${action}`,
        entity_type: "wallet_transaction",
        entity_id: tx.id,
        details: { type: tx.type, amount: tx.amount, action },
      });
      fetchData();
    }
    setProcessing(null);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">مدیریت کیف پول‌ها</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            درخواست‌های در انتظار ({pendingTxs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTxs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">درخواستی در انتظار نیست</p>
          ) : (
            <div className="space-y-3">
              {pendingTxs.map((tx) => {
                const wallet = wallets.find(w => w.id === tx.wallet_id);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/30">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={tx.type === "deposit" ? "default" : "secondary"}>
                          {tx.type === "deposit" ? "واریز" : "برداشت"}
                        </Badge>
                        <span className="font-mono font-bold">{tx.amount.toLocaleString()} {wallet?.currency}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        روش: {tx.method === "cash" ? "نقدی" : tx.method === "wire" ? "حواله بانکی" : "حواله‌ای"}
                        {tx.notes && ` | ${tx.notes}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("fa-IR")} | موجودی فعلی: {wallet?.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-400/30" onClick={() => handleAction(tx, "approved")} disabled={processing === tx.id}>
                        {processing === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 ml-1" />}
                        تأیید
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleAction(tx, "rejected")} disabled={processing === tx.id}>
                        <XCircle className="h-4 w-4 ml-1" />
                        رد
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
