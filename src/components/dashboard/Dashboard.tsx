import { Loader2 } from "lucide-react";
import RateCard from "./RateCard";
import WalletCard from "./WalletCard";
import QuickStats from "./QuickStats";
import TransactionList from "../history/TransactionList";
import { useExchangeRates, useWallets, toAfn } from "@/hooks/useDashboardData";

const CURRENCY_META: Record<string, { name: string; flag: string; color: "emerald" | "gold" | "blue" }> = {
  AFN: { name: "افغانی", flag: "🇦🇫", color: "emerald" },
  USD: { name: "دلار آمریکا", flag: "🇺🇸", color: "gold" },
  EUR: { name: "یورو", flag: "🇪🇺", color: "blue" },
  IRR: { name: "ریال ایران", flag: "🇮🇷", color: "blue" },
};

const Dashboard = () => {
  const { rates, isLoading: ratesLoading } = useExchangeRates();
  const { wallets, isLoading: walletsLoading } = useWallets();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          به صرافی <span className="text-gradient-gold">افغان</span> خوش آمدید
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          تبدیل آسان و امن افغانی به دلار با بهترین نرخ‌های روز
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Exchange Rates */}
      <section>
        <h2 className="text-xl font-bold mb-4">نرخ‌های لحظه‌ای</h2>
        {ratesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rates.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز نرخی ثبت نشده است</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {rates.map((rate) => (
              <RateCard
                key={rate.id}
                fromCurrency={rate.from_currency}
                toCurrency={rate.to_currency}
                buyRate={Number(rate.buy_rate)}
                sellRate={Number(rate.sell_rate)}
                flag1={CURRENCY_META[rate.from_currency]?.flag ?? "🏳️"}
                flag2={CURRENCY_META[rate.to_currency]?.flag ?? "🏳️"}
                updatedAt={rate.updated_at}
              />
            ))}
          </div>
        )}
      </section>

      {/* Wallets */}
      <section>
        <h2 className="text-xl font-bold mb-4">کیف پول‌های من</h2>
        {walletsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : wallets.length === 0 ? (
          <p className="text-sm text-muted-foreground">برای مشاهده کیف پول‌ها وارد حساب خود شوید</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {wallets.map((wallet) => {
              const meta = CURRENCY_META[wallet.currency] ?? { name: wallet.currency, flag: "🏳️", color: "blue" as const };
              const afn = toAfn(rates, wallet.currency, Number(wallet.balance));
              return (
                <WalletCard
                  key={wallet.id}
                  currency={meta.name}
                  symbol={wallet.currency}
                  balance={Number(wallet.balance)}
                  equivalent={wallet.currency === "AFN" ? "" : `≈ ؋${Math.round(afn).toLocaleString()}`}
                  flag={meta.flag}
                  color={meta.color}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section>
        <TransactionList />
      </section>
    </div>
  );
};

export default Dashboard;
