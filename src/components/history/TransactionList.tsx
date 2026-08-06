import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "exchange";
  fromCurrency: string;
  toCurrency?: string;
  amount: number;
  toAmount?: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
}

const TransactionList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    let active = true;

    const load = async () => {
      const [transfersRes, walletTxRes] = await Promise.all([
        supabase
          .from("transfers")
          .select("id, from_currency, to_currency, amount, converted_amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("wallet_transactions")
          .select("id, type, amount, status, created_at, wallet_id, wallets(currency)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const mapped: Transaction[] = [
        ...((transfersRes.data ?? []).map((t) => ({
          id: t.id,
          type: "exchange" as const,
          fromCurrency: t.from_currency,
          toCurrency: t.to_currency,
          amount: Number(t.amount),
          toAmount: Number(t.converted_amount),
          status: t.status as Transaction["status"],
          createdAt: t.created_at,
        }))),
        ...((walletTxRes.data ?? []).map((w: any) => ({
          id: w.id,
          type: (w.type === "withdrawal" || w.type === "withdraw" ? "withdraw" : "deposit") as
            | "deposit"
            | "withdraw",
          fromCurrency: w.wallets?.currency ?? "",
          amount: Number(w.amount),
          status: (w.status === "approved" ? "completed" : w.status) as Transaction["status"],
          createdAt: w.created_at,
        }))),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

      if (active) {
        setTransactions(mapped);
        setIsLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel("dashboard-transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "transfers", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getTypeIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4" />;
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4" />;
      case "exchange":
        return <RefreshCcw className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "واریز";
      case "withdraw":
        return "برداشت";
      case "exchange":
        return "حواله / تبدیل";
    }
  };

  const getTypeColor = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "bg-success/10 text-success";
      case "withdraw":
        return "bg-destructive/10 text-destructive";
      case "exchange":
        return "bg-accent/10 text-accent";
    }
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    const classes: Record<string, string> = {
      pending: "status-badge status-pending",
      completed: "status-badge status-completed",
      failed: "status-badge status-failed",
      cancelled: "status-badge status-failed",
    };
    const labels: Record<string, string> = {
      pending: "در انتظار",
      completed: "تکمیل شده",
      failed: "ناموفق",
      cancelled: "لغو شده",
    };
    return <span className={classes[status] ?? "status-badge"}>{labels[status] ?? status}</span>;
  };

  return (
    <div className="rate-card border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">تاریخچه تراکنش‌ها</h2>
        <button
          className="text-sm text-primary hover:underline"
          onClick={() => navigate("/transfers/history")}
        >
          مشاهده همه
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">هنوز تراکنشی ثبت نشده است</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div
              key={`${tx.type}-${tx.id}`}
              className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-3 rounded-xl ${getTypeColor(tx.type)}`}>{getTypeIcon(tx.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{getTypeLabel(tx.type)}</span>
                  {tx.type === "exchange" && (
                    <span className="text-sm text-muted-foreground">
                      {tx.fromCurrency} → {tx.toCurrency}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(tx.createdAt).toLocaleDateString("fa-IR")} -{" "}
                  {new Date(tx.createdAt).toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="text-left">
                <p
                  className={`font-mono font-semibold ${
                    tx.type === "withdraw" ? "text-destructive" : "text-success"
                  }`}
                >
                  {tx.type === "withdraw" ? "-" : "+"}
                  {tx.amount.toLocaleString()} {tx.fromCurrency}
                </p>
                {tx.type === "exchange" && tx.toAmount ? (
                  <p className="text-xs text-muted-foreground font-mono">
                    → {tx.toAmount.toLocaleString()} {tx.toCurrency}
                  </p>
                ) : null}
              </div>

              <div className="hidden sm:block">{getStatusBadge(tx.status)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
