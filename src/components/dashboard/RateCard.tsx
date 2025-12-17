import { TrendingUp, TrendingDown } from "lucide-react";

interface RateCardProps {
  fromCurrency: string;
  toCurrency: string;
  buyRate: number;
  sellRate: number;
  change: number;
  flag1: string;
  flag2: string;
}

const RateCard = ({ fromCurrency, toCurrency, buyRate, sellRate, change, flag1, flag2 }: RateCardProps) => {
  const isPositive = change >= 0;

  return (
    <div className="rate-card border border-border/50 group hover:border-primary/30 transition-all duration-500">
      {/* Currency Pair Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <span className="text-2xl">{flag1}</span>
            <span className="text-2xl">{flag2}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {fromCurrency}/{toCurrency}
            </h3>
            <p className="text-xs text-muted-foreground">نرخ لحظه‌ای</p>
          </div>
        </div>
        
        {/* Change Indicator */}
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
          isPositive 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        }`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {Math.abs(change).toFixed(2)}%
        </div>
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Rate */}
        <div className="bg-success/5 rounded-xl p-4 border border-success/20">
          <p className="text-xs text-muted-foreground mb-1">خرید</p>
          <p className="text-2xl font-bold font-mono text-success number-display">
            {buyRate.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{toCurrency}</p>
        </div>

        {/* Sell Rate */}
        <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
          <p className="text-xs text-muted-foreground mb-1">فروش</p>
          <p className="text-2xl font-bold font-mono text-destructive number-display">
            {sellRate.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{toCurrency}</p>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span className="text-xs text-muted-foreground">به‌روزرسانی لحظه‌ای</span>
      </div>
    </div>
  );
};

export default RateCard;
