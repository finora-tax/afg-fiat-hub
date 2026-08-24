import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, Loader2, Send, Download, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  recipient_phone: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  notes: string | null;
  status: "pending" | "completed" | "cancelled" | "failed";
  created_at: string;
}

const PendingTransfers = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchTransfers = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase.from("transfers").select("*").eq("user_id", user.id).eq("status", "pending").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "خطا", description: "دریافت حواله‌های در انتظار انجام نشد", variant: "destructive" });
      setTransfers([]);
    } else if (data) setTransfers(data as Transfer[]);
    setIsLoading(false);
  };

  useEffect(() => { if (user) fetchTransfers(); }, [user]);

  const handleCancel = async (transferId: string) => {
    if (!user || cancellingId) return;
    setCancellingId(transferId);
    const { data, error } = await supabase.from("transfers").update({ status: "cancelled" }).eq("id", transferId).eq("user_id", user.id).eq("status", "pending").select("id").maybeSingle();
    setCancellingId(null);
    if (error) {
      toast({ title: "خطا", description: "مشکلی در لغو حواله رخ داد", variant: "destructive" });
      return;
    }
    if (!data) {
      toast({ title: "عملیات انجام نشد", description: "این حواله دیگر در وضعیت انتظار نیست یا دسترسی به آن ندارید", variant: "destructive" });
      await fetchTransfers();
      return;
    }
    toast({ title: "موفق", description: "حواله با موفقیت لغو شد" });
    await fetchTransfers();
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (authLoading || isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <div className="min-h-screen bg-background" dir="rtl"><Header /><main className="container mx-auto px-4 pt-24 pb-12"><div className="max-w-4xl mx-auto"><div className="flex items-center justify-between mb-6"><Button variant="ghost" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 ml-2" />بازگشت</Button><Button variant="outline" onClick={fetchTransfers} disabled={!!cancellingId}><RefreshCw className="h-4 w-4 ml-2" />بروزرسانی</Button></div><Card className="border-border/50 bg-card/80 backdrop-blur-xl"><CardHeader className="text-center"><div className="mx-auto h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center mb-4"><Clock className="h-6 w-6 text-warning" /></div><CardTitle className="text-2xl">حواله‌های در انتظار</CardTitle><CardDescription>لیست حواله‌هایی که در انتظار تأیید هستند</CardDescription></CardHeader><CardContent>{transfers.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Clock className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>حواله‌ای در انتظار ندارید</p></div> : <div className="space-y-4">{transfers.map((transfer) => <div key={transfer.id} className="p-4 rounded-xl bg-secondary/30 border border-border/50"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-lg flex items-center justify-center ${transfer.transfer_type === "send" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>{transfer.transfer_type === "send" ? <Send className="h-5 w-5" /> : <Download className="h-5 w-5" />}</div><div><h4 className="font-semibold">{transfer.transfer_type === "send" ? "ارسال حواله" : "دریافت حواله"}</h4><p className="text-sm text-muted-foreground">{transfer.transfer_type === "send" ? `به: ${transfer.recipient_name}` : `از: ${transfer.sender_name}`}</p></div></div><Badge variant="secondary" className="bg-warning/20 text-warning">در انتظار</Badge></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4"><div><p className="text-muted-foreground">مبلغ</p><p className="font-mono font-semibold">{transfer.amount} {transfer.from_currency}</p></div><div><p className="text-muted-foreground">معادل</p><p className="font-mono font-semibold text-primary">{transfer.converted_amount.toFixed(2)} {transfer.to_currency}</p></div><div><p className="text-muted-foreground">نرخ</p><p className="font-mono">{transfer.exchange_rate}</p></div><div><p className="text-muted-foreground">تاریخ</p><p className="text-xs">{formatDate(transfer.created_at)}</p></div></div>{transfer.notes && <p className="text-sm text-muted-foreground mb-4 p-2 bg-background/50 rounded-lg break-words">توضیحات: {transfer.notes}</p>}<div className="flex justify-end"><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={cancellingId === transfer.id}><X className="h-4 w-4 ml-2" />{cancellingId === transfer.id ? "در حال لغو..." : "لغو حواله"}</Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>لغو حواله</AlertDialogTitle><AlertDialogDescription>آیا مطمئن هستید که می‌خواهید این حواله را لغو کنید؟ این عملیات قابل بازگشت نیست.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-row-reverse gap-2"><AlertDialogCancel disabled={cancellingId === transfer.id}>انصراف</AlertDialogCancel><AlertDialogAction onClick={() => handleCancel(transfer.id)} disabled={cancellingId === transfer.id} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">بله، لغو شود</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>)}</div>}</CardContent></Card></div></main></div>;
};

export default PendingTransfers;
