import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users,
  ArrowUpDown,
  BarChart3,
  PieChart
} from "lucide-react";
import { useState } from "react";

const summaryStats = [
  {
    title: "کل معاملات",
    value: "۱,۲۵۶",
    change: "+12.5%",
    trend: "up",
    icon: ArrowUpDown,
  },
  {
    title: "حجم معاملات",
    value: "۴۵,۲۳۰,۰۰۰ AFN",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "درآمد کارمزد",
    value: "۴۵۲,۳۰۰ AFN",
    change: "+15.3%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "کاربران فعال",
    value: "۳۲۸",
    change: "+5.1%",
    trend: "up",
    icon: Users,
  },
];

const recentTransactions = [
  {
    id: "TXN001",
    user: "احمد محمدی",
    type: "buy",
    fromAmount: "1,000 USD",
    toAmount: "71,200 AFN",
    fee: "712 AFN",
    status: "completed",
    date: "1402/10/05 14:30",
  },
  {
    id: "TXN002",
    user: "فاطمه رحیمی",
    type: "sell",
    fromAmount: "50,000 AFN",
    toAmount: "702 USD",
    fee: "500 AFN",
    status: "completed",
    date: "1402/10/05 13:15",
  },
  {
    id: "TXN003",
    user: "محمد کریمی",
    type: "buy",
    fromAmount: "500 EUR",
    toAmount: "38,550 AFN",
    fee: "385 AFN",
    status: "pending",
    date: "1402/10/05 12:00",
  },
  {
    id: "TXN004",
    user: "زهرا احمدی",
    type: "sell",
    fromAmount: "100,000 AFN",
    toAmount: "1,404 USD",
    fee: "1,000 AFN",
    status: "completed",
    date: "1402/10/05 11:45",
  },
  {
    id: "TXN005",
    user: "علی حسینی",
    type: "buy",
    fromAmount: "2,000 USD",
    toAmount: "142,400 AFN",
    fee: "1,424 AFN",
    status: "completed",
    date: "1402/10/05 10:30",
  },
];

const currencyVolumes = [
  { currency: "USD", buy: "۱۲,۵۰۰", sell: "۸,۳۲۰", total: "۲۰,۸۲۰" },
  { currency: "EUR", buy: "۳,۲۰۰", sell: "۲,۱۵۰", total: "۵,۳۵۰" },
  { currency: "IRR", buy: "۵۲۰M", sell: "۳۸۰M", total: "۹۰۰M" },
];

export const FinancialReports = () => {
  const [period, setPeriod] = useState("daily");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">گزارش‌های مالی</h2>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">روزانه</SelectItem>
              <SelectItem value="weekly">هفتگی</SelectItem>
              <SelectItem value="monthly">ماهانه</SelectItem>
              <SelectItem value="yearly">سالانه</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            دانلود گزارش
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={stat.trend === "up" ? "text-primary text-sm" : "text-destructive text-sm"}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Currency Volume Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            حجم معاملات بر اساس ارز
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right">ارز</TableHead>
                <TableHead className="text-right">خرید</TableHead>
                <TableHead className="text-right">فروش</TableHead>
                <TableHead className="text-right">مجموع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencyVolumes.map((vol) => (
                <TableRow key={vol.currency} className="border-border">
                  <TableCell className="font-medium">{vol.currency}</TableCell>
                  <TableCell className="text-primary font-mono">{vol.buy}</TableCell>
                  <TableCell className="text-destructive font-mono">{vol.sell}</TableCell>
                  <TableCell className="text-accent font-mono font-bold">{vol.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            آخرین معاملات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right">شناسه</TableHead>
                <TableHead className="text-right">کاربر</TableHead>
                <TableHead className="text-right">نوع</TableHead>
                <TableHead className="text-right">مبدأ</TableHead>
                <TableHead className="text-right">مقصد</TableHead>
                <TableHead className="text-right">کارمزد</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id} className="border-border">
                  <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                  <TableCell>{tx.user}</TableCell>
                  <TableCell>
                    <Badge className={tx.type === "buy" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}>
                      {tx.type === "buy" ? "خرید" : "فروش"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{tx.fromAmount}</TableCell>
                  <TableCell className="font-mono text-sm">{tx.toAmount}</TableCell>
                  <TableCell className="font-mono text-sm text-accent">{tx.fee}</TableCell>
                  <TableCell>
                    <Badge className={tx.status === "completed" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}>
                      {tx.status === "completed" ? "تکمیل" : "در انتظار"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
