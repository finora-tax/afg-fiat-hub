import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, ArrowLeft, Loader2, Send, Download, CheckCircle, XCircle, Clock } from "lucide-react";

interface Transfer {
  id: string;
  transfer_type: "send" | "receive";
  from_currency: string;
  to_currency: string;
  amount: number;
  converted_amount: number;
  exchange_rate: number;
  fee: number;
  recipient_name: string | null;
  sender_name: string | null;
  status: "pending" | "completed" | "cancelled" | "failed";
  created_at: string;
}

const TransferHistory = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filter, setFilter] = useState<"all" | "send" | "receive">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!user) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTransfers(data as Transfer[]);
      }
      setIsLoading(false);
    };

    if (user) {
      fetchTransfers();
    }
  }, [user]);

  const filteredTransfers = transfers.filter((t) => {
    if (filter === "all") return true;
    return t.transfer_type === filter;
  });

  const getStatusBadge = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/20 text-success"><CheckCircle className="h-3 w-3 ml-1" /> تکمیل شده</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning"><Clock className="h-3 w-3 ml-1" /> در انتظار</Badge>;
      case "cancelled":
        return <Badge className="bg-muted text-muted-foreground"><XCircle className="h-3 w-3 ml-1" /> لغو شده</Badge>;
      case "failed":
        return <Badge className="bg-destructive/20 text-destructive"><XCircle className="h-3 w-3 ml-1" /> ناموفق</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <History className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">تاریخچه حواله‌ها</CardTitle>
              <CardDescription>مشاهده تمام تراکنش‌های حواله شما</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">همه</TabsTrigger>
                  <TabsTrigger value="send">ارسالی</TabsTrigger>
                  <TabsTrigger value="receive">دریافتی</TabsTrigger>
                </TabsList>
              </Tabs>

              {filteredTransfers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>تراکنشی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          transfer.transfer_type === "send" 
                            ? "bg-primary/20 text-primary" 
                            : "bg-accent/20 text-accent"
                        }`}>
                          {transfer.transfer_type === "send" ? (
                            <Send className="h-5 w-5" />
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {transfer.transfer_type === "send" ? "ارسال" : "دریافت"}
                            {" "}
                            <span className="font-mono">{transfer.amount} {transfer.from_currency}</span>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {transfer.transfer_type === "send" 
                              ? `به: ${transfer.recipient_name}` 
                              : `از: ${transfer.sender_name}`}
                            {" • "}
                            {formatDate(transfer.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        {getStatusBadge(transfer.status)}
                        <p className="text-sm font-mono mt-1 text-primary">
                          {transfer.converted_amount.toFixed(2)} {transfer.to_currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TransferHistory;
