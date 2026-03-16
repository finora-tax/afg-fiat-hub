import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, DollarSign, Users, ArrowUpDown, BarChart3, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Transfer {
  id: string;
  user_id: string;
  transfer_type: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  converted_amount: number;
  fee: number | null;
  status: string;
  created_at: string;
  sender_name: string | null;
  recipient_name: string | null;
}

export const FinancialReports = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        toast.error("خطا در دریافت گزارش‌ها");
      } else {
        setTransfers(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const completedTransfers = transfers.filter(t => t.status === "completed");
  const totalVolume = completedTransfers.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = completedTransfers.reduce((sum, t) => sum + (t.fee || 0), 0);

  const summaryStats = [
    { title: "کل معاملات", value: transfers.length.toLocaleString("fa-IR"), icon: ArrowUpDown },
    { title: "حجم معاملات", value: `${totalVolume.toLocaleString("fa-IR")}`, icon: DollarSign },
    { title: "درآمد کارمزد", value: `${totalFees.toLocaleString("fa-IR")}`, icon: TrendingUp },
    { title: "معاملات تکمیل شده", value: completedTransfers.length.toLocaleString("fa-IR"), icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">گزارش‌های مالی</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                <TableHead className="text-right">نوع</TableHead>
                <TableHead className="text-right">مبلغ</TableHead>
                <TableHead className="text-right">ارز مبدأ</TableHead>
                <TableHead className="text-right">ارز مقصد</TableHead>
                <TableHead className="text-right">کارمزد</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.slice(0, 20).map((tx) => (
                <TableRow key={tx.id} className="border-border">
                  <TableCell>
                    <Badge className={tx.transfer_type === "send" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}>
                      {tx.transfer_type === "send" ? "ارسال" : "دریافت"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{tx.amount.toLocaleString()}</TableCell>
                  <TableCell>{tx.from_currency}</TableCell>
                  <TableCell>{tx.to_currency}</TableCell>
                  <TableCell className="font-mono text-sm text-accent">{(tx.fee || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={tx.status === "completed" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}>
                      {tx.status === "completed" ? "تکمیل" : tx.status === "pending" ? "در انتظار" : tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("fa-IR")}</TableCell>
                </TableRow>
              ))}
              {transfers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">معامله‌ای یافت نشد</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
