import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WalletCardProps {
  currency: string;
  symbol: string;
  balance: number;
  equivalent: string;
  flag: string;
  color: "emerald" | "gold" | "blue";
}

const WalletCard = ({ currency, symbol, balance, equivalent, flag, color }: WalletCardProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const navigate = useNavigate();

  const colorClasses = {
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
    gold: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
  };

  const iconColorClasses = {
    emerald: "text-emerald-400",
    gold: "text-amber-400",
    blue: "text-blue-400",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <span className="text-8xl">{flag}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{flag}</span>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{currency}</h3>
            <p className="text-xs text-muted-foreground/70">{symbol}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsHidden(!isHidden)}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          {isHidden ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Balance */}
      <div className="mb-6">
        <p className={`text-3xl font-bold font-mono number-display ${iconColorClasses[color]}`}>
          {isHidden ? "••••••" : balance.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isHidden ? "••••" : equivalent}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate("/wallets")}>
          <ArrowDownLeft className="h-4 w-4 ml-1" />
          واریز
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate("/wallets")}>
          <ArrowUpRight className="h-4 w-4 ml-1" />
          برداشت
        </Button>
      </div>
    </div>
  );
};

export default WalletCard;
