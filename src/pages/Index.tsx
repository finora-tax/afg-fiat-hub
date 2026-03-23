import { useState } from "react";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";
import ExchangeForm from "@/components/exchange/ExchangeForm";
import TransactionList from "@/components/history/TransactionList";
import SettingsPanel from "@/components/settings/SettingsPanel";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "exchange":
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">تبدیل ارز</h1>
              <p className="text-muted-foreground">
                تبدیل آنی افغانی به دلار با بهترین نرخ
              </p>
            </div>
            <ExchangeForm />
          </div>
        );
      case "history":
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">تراکنش‌ها</h1>
              <p className="text-muted-foreground">
                مشاهده تاریخچه کامل تراکنش‌های شما
              </p>
            </div>
            <TransactionList />
          </div>
        );
      case "settings":
        return <SettingsPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">AF</span>
                </div>
                <span className="font-bold">صرافی افغان</span>
              </div>
              <p className="text-sm text-muted-foreground">
                تبدیل امن و سریع ارزهای فیات با تمرکز بر افغانی
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">خدمات</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>تبدیل ارز</li>
                <li>کیف پول</li>
                <li>حواله</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">پشتیبانی</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>راهنما</li>
                <li>سوالات متداول</li>
                <li>تماس با ما</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">قوانین</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>شرایط استفاده</li>
                <li>حریم خصوصی</li>
                <li>AML/KYC</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
            © ۱۴۰۳ صرافی افغان - تمامی حقوق محفوظ است
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
