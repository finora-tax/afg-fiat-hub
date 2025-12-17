import { useState, useEffect } from "react";
import { ArrowDownUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExchangeForm = () => {
  const [fromAmount, setFromAmount] = useState<string>("1000");
  const [toAmount, setToAmount] = useState<string>("");
  const [fromCurrency, setFromCurrency] = useState<"AFN" | "USD">("AFN");
  const [toCurrency, setToCurrency] = useState<"AFN" | "USD">("USD");

  // Mock rates
  const rates = {
    AFN_USD: 0.0114, // 1 AFN = 0.0114 USD (buy rate)
    USD_AFN: 87.50,  // 1 USD = 87.50 AFN (sell rate)
  };

  const fee = 0.005; // 0.5% fee

  useEffect(() => {
    if (fromAmount) {
      const amount = parseFloat(fromAmount);
      if (!isNaN(amount)) {
        let converted: number;
        if (fromCurrency === "AFN" && toCurrency === "USD") {
          converted = amount * rates.AFN_USD;
        } else {
          converted = amount * rates.USD_AFN;
        }
        const afterFee = converted * (1 - fee);
        setToAmount(afterFee.toFixed(2));
      }
    }
  }, [fromAmount, fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
  };

  const currencies = {
    AFN: { name: "افغانی", flag: "🇦🇫", symbol: "؋" },
    USD: { name: "دلار", flag: "🇺🇸", symbol: "$" },
  };

  return (
    <div className="rate-card border border-border/50 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-6 text-center">تبدیل ارز</h2>

      {/* From Currency */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-2 block">از</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="currency-input w-full bg-secondary/50"
              placeholder="0.00"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl border border-border/50 hover:border-primary/50 transition-all"
          >
            <span className="text-xl">{currencies[fromCurrency].flag}</span>
            <span className="font-semibold">{fromCurrency}</span>
          </button>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center my-4">
        <button
          onClick={handleSwap}
          className="p-3 rounded-full bg-secondary border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group"
        >
          <ArrowDownUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* To Currency */}
      <div className="mb-6">
        <label className="text-sm text-muted-foreground mb-2 block">به</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={toAmount}
              readOnly
              className="currency-input w-full bg-secondary/30 text-success"
              placeholder="0.00"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl border border-border/50 hover:border-primary/50 transition-all"
          >
            <span className="text-xl">{currencies[toCurrency].flag}</span>
            <span className="font-semibold">{toCurrency}</span>
          </button>
        </div>
      </div>

      {/* Exchange Details */}
      <div className="bg-secondary/30 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">نرخ تبدیل</span>
          <span className="font-mono">
            1 {fromCurrency} = {fromCurrency === "AFN" ? rates.AFN_USD.toFixed(4) : rates.USD_AFN.toFixed(2)} {toCurrency}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">کارمزد</span>
          <span className="font-mono text-warning">{(fee * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border/50">
          <span className="text-muted-foreground">دریافتی نهایی</span>
          <span className="font-mono font-bold text-success">
            {toAmount} {toCurrency}
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">تبدیل فوری</p>
          <p className="text-xs text-muted-foreground mt-1">
            تراکنش شما به صورت آنی انجام می‌شود و مبلغ به کیف پول شما واریز خواهد شد.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button variant="default" size="lg" className="w-full">
        تأیید و تبدیل
      </Button>
    </div>
  );
};

export default ExchangeForm;
