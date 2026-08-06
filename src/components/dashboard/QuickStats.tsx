import { useEffect, useState } from "react";
import { TrendingUp, Clock, RefreshCcw, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useExchangeRates, useWallets, toAfn } from "@/hooks/useDashboardData";

const QuickStats = () => {
  const { user } = useAuth();
  const { rates } = useExchangeRates();
  const { wallets } = useWallets();
  const [volume24h, setVolume24h] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("transfers")
        .select("amount, from_currency, status, created_at")
        .eq("user_id", user.id)
        .gte("created_at", since);

      const rows = data ?? [];
      setTodayCount(rows.length);
      setVolume24h(
        rows.reduce((sum, r) => sum + toAfn(rates, r.from_currency, Number(r.amount)), 0)
      );

      const { count } = await supabase
        .from("transfers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    };
    load();
  }, [user, rates]);

  const totalAfn = wallets.reduce(
    (sum, w) => sum + toAfn(rates, w.currency, Number(w.balance)),
    0
  );

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return Math.round(n).toLocaleString();
  };

  const stats = [
    {
      label: "دارایی کل من",
      value: formatCompact(totalAfn),
      unit: "AFN",
      icon: Wallet,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "حجم معاملات ۲۴ ساعته",
      value: formatCompact(volume24h),
      unit: "AFN",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "تراکنش‌های ۲۴ ساعت اخیر",
      value: todayCount.toLocaleString(),
      unit: "تراکنش",
      icon: RefreshCcw,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "در انتظار تأیید",
      value: pendingCount.toLocaleString(),
      unit: "مورد",
      icon: Clock,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-card/50 border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-all duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold font-mono ${stat.color}`}>
            {stat.value}
            <span className="text-sm text-muted-foreground mr-1">{stat.unit}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
