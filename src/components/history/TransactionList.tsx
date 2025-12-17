import { ArrowUpRight, ArrowDownLeft, RefreshCcw } from "lucide-react";

interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "exchange";
  fromCurrency: string;
  toCurrency?: string;
  amount: number;
  toAmount?: number;
  status: "pending" | "completed" | "failed";
  date: string;
  time: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "exchange",
    fromCurrency: "AFN",
    toCurrency: "USD",
    amount: 87500,
    toAmount: 1000,
    status: "completed",
    date: "۱۴۰۳/۰۹/۲۶",
    time: "۱۴:۳۲",
  },
  {
    id: "2",
    type: "deposit",
    fromCurrency: "AFN",
    amount: 50000,
    status: "completed",
    date: "۱۴۰۳/۰۹/۲۵",
    time: "۱۰:۱۵",
  },
  {
    id: "3",
    type: "withdraw",
    fromCurrency: "USD",
    amount: 500,
    status: "pending",
    date: "۱۴۰۳/۰۹/۲۵",
    time: "۰۹:۴۵",
  },
  {
    id: "4",
    type: "exchange",
    fromCurrency: "USD",
    toCurrency: "AFN",
    amount: 2000,
    toAmount: 175000,
    status: "completed",
    date: "۱۴۰۳/۰۹/۲۴",
    time: "۱۶:۲۰",
  },
  {
    id: "5",
    type: "deposit",
    fromCurrency: "USD",
    amount: 3000,
    status: "failed",
    date: "۱۴۰۳/۰۹/۲۳",
    time: "۱۱:۰۰",
  },
];

const TransactionList = () => {
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
        return "تبدیل";
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
    const classes = {
      pending: "status-badge status-pending",
      completed: "status-badge status-completed",
      failed: "status-badge status-failed",
    };
    const labels = {
      pending: "در انتظار",
      completed: "تکمیل شده",
      failed: "ناموفق",
    };
    return <span className={classes[status]}>{labels[status]}</span>;
  };

  return (
    <div className="rate-card border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">تاریخچه تراکنش‌ها</h2>
        <button className="text-sm text-primary hover:underline">مشاهده همه</button>
      </div>

      <div className="space-y-3">
        {mockTransactions.map((tx, index) => (
          <div
            key={tx.id}
            className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Icon */}
            <div className={`p-3 rounded-xl ${getTypeColor(tx.type)}`}>
              {getTypeIcon(tx.type)}
            </div>

            {/* Details */}
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
                {tx.date} - {tx.time}
              </p>
            </div>

            {/* Amount */}
            <div className="text-left">
              <p className={`font-mono font-semibold ${
                tx.type === "withdraw" ? "text-destructive" : "text-success"
              }`}>
                {tx.type === "withdraw" ? "-" : "+"}{tx.amount.toLocaleString()} {tx.fromCurrency}
              </p>
              {tx.type === "exchange" && tx.toAmount && (
                <p className="text-xs text-muted-foreground font-mono">
                  → {tx.toAmount.toLocaleString()} {tx.toCurrency}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="hidden sm:block">
              {getStatusBadge(tx.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
