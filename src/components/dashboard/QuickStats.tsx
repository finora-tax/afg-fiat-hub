import { TrendingUp, Users, RefreshCcw, Shield } from "lucide-react";

const QuickStats = () => {
  const stats = [
    {
      label: "حجم معاملات ۲۴ ساعته",
      value: "۱۲.۵M",
      unit: "AFN",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "کاربران فعال",
      value: "۲,۵۴۸",
      unit: "نفر",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "تراکنش‌های امروز",
      value: "۸۷۳",
      unit: "تراکنش",
      icon: RefreshCcw,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "امنیت سیستم",
      value: "۱۰۰",
      unit: "%",
      icon: Shield,
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
