import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Save, RefreshCw } from "lucide-react";

export const RateManagement = () => {
  const [rates, setRates] = useState({
    usdBuy: "70.50",
    usdSell: "71.20",
    eurBuy: "76.30",
    eurSell: "77.10",
    irrBuy: "0.0017",
    irrSell: "0.0018",
  });

  const handleSaveRates = () => {
    toast.success("نرخ‌ها با موفقیت ذخیره شدند");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">مدیریت نرخ ارز</h2>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ml-2" />
          بازنشانی
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* USD Rate */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🇺🇸</span>
              دلار آمریکا (USD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                نرخ خرید (AFN)
              </Label>
              <Input
                type="number"
                value={rates.usdBuy}
                onChange={(e) => setRates({ ...rates, usdBuy: e.target.value })}
                className="text-left font-mono"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-destructive" />
                نرخ فروش (AFN)
              </Label>
              <Input
                type="number"
                value={rates.usdSell}
                onChange={(e) => setRates({ ...rates, usdSell: e.target.value })}
                className="text-left font-mono"
                dir="ltr"
              />
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                اسپرد: <span className="text-accent font-mono">{(parseFloat(rates.usdSell) - parseFloat(rates.usdBuy)).toFixed(2)} AFN</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* EUR Rate */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🇪🇺</span>
              یورو (EUR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                نرخ خرید (AFN)
              </Label>
              <Input
                type="number"
                value={rates.eurBuy}
                onChange={(e) => setRates({ ...rates, eurBuy: e.target.value })}
                className="text-left font-mono"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-destructive" />
                نرخ فروش (AFN)
              </Label>
              <Input
                type="number"
                value={rates.eurSell}
                onChange={(e) => setRates({ ...rates, eurSell: e.target.value })}
                className="text-left font-mono"
                dir="ltr"
              />
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                اسپرد: <span className="text-accent font-mono">{(parseFloat(rates.eurSell) - parseFloat(rates.eurBuy)).toFixed(2)} AFN</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* IRR Rate */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🇮🇷</span>
              ریال ایران (IRR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                نرخ خرید (AFN)
              </Label>
              <Input
                type="number"
                value={rates.irrBuy}
                onChange={(e) => setRates({ ...rates, irrBuy: e.target.value })}
                className="text-left font-mono"
                dir="ltr"
                step="0.0001"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-destructive" />
                نرخ فروش (AFN)
              </Label>
              <Input
                type="number"
                value={rates.irrSell}
                onChange={(e) => setRates({ ...rates, irrSell: e.target.value })}
                className="text-left font-mono"
                dir="ltr"
                step="0.0001"
              />
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                اسپرد: <span className="text-accent font-mono">{(parseFloat(rates.irrSell) - parseFloat(rates.irrBuy)).toFixed(4)} AFN</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveRates} className="bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4 ml-2" />
          ذخیره نرخ‌ها
        </Button>
      </div>
    </div>
  );
};
