import { User, Shield, Bell, Globe, Moon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SettingsPanel = () => {
  const settingsSections = [
    {
      title: "اطلاعات شخصی",
      icon: User,
      description: "نام، ایمیل و شماره تماس",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "احراز هویت (KYC)",
      icon: Shield,
      description: "تأیید هویت برای افزایش سقف تراکنش",
      color: "text-warning",
      bgColor: "bg-warning/10",
      badge: "در انتظار تأیید",
    },
    {
      title: "اعلان‌ها",
      icon: Bell,
      description: "تنظیمات پیامک و ایمیل",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      title: "زبان و منطقه",
      icon: Globe,
      description: "فارسی - افغانستان",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      title: "تم برنامه",
      icon: Moon,
      description: "حالت تاریک فعال است",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">تنظیمات</h1>
        <p className="text-muted-foreground">مدیریت حساب کاربری و تنظیمات برنامه</p>
      </div>

      {/* Profile Card */}
      <div className="rate-card border border-border/50 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-2xl font-bold text-primary-foreground">
            ع
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">علی احمدی</h3>
            <p className="text-sm text-muted-foreground">ali.ahmadi@email.com</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="status-badge status-pending">KYC در انتظار</span>
              <span className="text-xs text-muted-foreground">سطح ۱</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            ویرایش
          </Button>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {settingsSections.map((section) => (
          <button
            key={section.title}
            className="w-full rate-card border border-border/50 hover:border-primary/30 transition-all duration-300 text-right"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${section.bgColor}`}>
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{section.title}</h3>
                  {section.badge && (
                    <span className="status-badge status-pending text-xs">
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <h3 className="text-sm font-semibold text-destructive mb-4">منطقه خطر</h3>
        <Button variant="destructive" className="w-full">
          خروج از حساب کاربری
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
