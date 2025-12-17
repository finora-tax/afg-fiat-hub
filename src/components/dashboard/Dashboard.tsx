import RateCard from "./RateCard";
import WalletCard from "./WalletCard";
import QuickStats from "./QuickStats";
import TransactionList from "../history/TransactionList";

const Dashboard = () => {
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
        <div className="grid md:grid-cols-2 gap-6">
          <RateCard
            fromCurrency="AFN"
            toCurrency="USD"
            buyRate={87.50}
            sellRate={88.20}
            change={0.85}
            flag1="🇦🇫"
            flag2="🇺🇸"
          />
          <RateCard
            fromCurrency="AFN"
            toCurrency="EUR"
            buyRate={92.30}
            sellRate={93.10}
            change={-0.32}
            flag1="🇦🇫"
            flag2="🇪🇺"
          />
        </div>
      </section>

      {/* Wallets */}
      <section>
        <h2 className="text-xl font-bold mb-4">کیف پول‌های من</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <WalletCard
            currency="افغانی"
            symbol="AFN"
            balance={245000}
            equivalent="≈ $2,800"
            flag="🇦🇫"
            color="emerald"
          />
          <WalletCard
            currency="دلار آمریکا"
            symbol="USD"
            balance={1250}
            equivalent="≈ ؋109,375"
            flag="🇺🇸"
            color="gold"
          />
          <WalletCard
            currency="یورو"
            symbol="EUR"
            balance={500}
            equivalent="≈ ؋46,150"
            flag="🇪🇺"
            color="blue"
          />
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <TransactionList />
      </section>
    </div>
  );
};

export default Dashboard;
