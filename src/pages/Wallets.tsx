import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, Eye, EyeOff, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletData {
  id: string;
  currency: string;
  balance: number;
  frozen_balance: number;
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  status: string;
  method: string;
  notes: string | null;
  created_at: string;
  wallet_id: string;
}

const currencyInfo: Record<string, { flag: string; name: string; color: string }> = {
  AFN: { flag: "🇦🇫", name: "افغانی", color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30" },
  USD: { flag: "🇺🇸", name: "دلار آمریکا", color: "from-amber-500/20 to-amber-600/5 border-amber-500/30" },
  EUR: { flag: "🇪🇺", name: "یورو", color: "from-blue-500/20 to-blue-600/5 border-blue-500/30" },
};

const Wallets = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txType, setTxType] = useState<"deposit" | "withdrawal">("deposit");
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [txAmount, setTxAmount] = useState("");
  const [txMethod, setTxMethod] = useState("cash");
  const [txNotes, setTxNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [walletsRes, txRes] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", user.id),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (walletsRes.data) setWallets(walletsRes.data);
    if (txRes.data) setTransactions(txRes.data as WalletTx[]);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleSubmitTx = async () => {
    if (!user || !selectedWallet || !txAmount) return;
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "خطا", description: "مبلغ باید عدد مثبت باشد", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      wallet_id: selectedWallet,
      type: txType,
      amount,
      method: txMethod,
      notes: txNotes || null,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "خطا", description: "مشکلی در ثبت درخواست رخ داد", variant: "destructive" });
    } else {
      toast({ title: "موفق", description: `درخواست ${txType === "deposit" ? "واریز" : "برداشت"} ثبت شد` });
      setDialogOpen(false);
      setTxAmount("");
      setTxNotes("");
      fetchData();
    }
  };

  const openDialog = (type: "deposit" | "withdrawal", walletId: string) => {
    setTxType(type);
    setSelectedWallet(walletId);
    setDialogOpen(true);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-amber-400 border-amber-400/30"><Clock className="h-3 w-3 ml-1" />در انتظار</Badge>;
      case "approved": return <Badge variant="outline" className="text-emerald-400 border-emerald-400/30"><CheckCircle className="h-3 w-3 ml-1" />تأیید شده</Badge>;
      case "rejected": return <Badge variant="outline" className="text-destructive border-destructive/30"><XCircle className="h-3 w-3 ml-1" />رد شده</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">کیف پول‌ها</h1>
          </div>
          <button onClick={() => setBalanceHidden(!balanceHidden)} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
            {balanceHidden ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
          </button>
        </div>

        {/* Wallet Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {wallets.map((w) => {
            const info = currencyInfo[w.currency] || { flag: "💰", name: w.currency, color: "from-secondary/20 to-secondary/5 border-secondary/30" };
            return (
              <Card key={w.id} className={`relative overflow-hidden bg-gradient-to-br ${info.color} border backdrop-blur-sm`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10"><span className="text-8xl">{info.flag}</span></div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{info.flag}</span>
                    {info.name} ({w.currency})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold font-mono mb-1">
                    {balanceHidden ? "••••••" : w.balance.toLocaleString()}
                  </p>
                  {w.frozen_balance > 0 && (
                    <p className="text-xs text-muted-foreground">مسدودی: {balanceHidden ? "••••" : w.frozen_balance.toLocaleString()}</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openDialog("deposit", w.id)}>
                      <ArrowDownLeft className="h-4 w-4 ml-1" />واریز
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openDialog("withdrawal", w.id)}>
                      <ArrowUpRight className="h-4 w-4 ml-1" />برداشت
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Transaction History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>تاریخچه واریز و برداشت</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">هنوز تراکنشی ثبت نشده است</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const wallet = wallets.find(w => w.id === tx.wallet_id);
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/30">
                      <div className="flex items-center gap-3">
                        {tx.type === "deposit" ? (
                          <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-amber-400" />
                        )}
                        <div>
                          <p className="font-medium">{tx.type === "deposit" ? "واریز" : "برداشت"} - {wallet?.currency}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("fa-IR")} | {tx.method === "cash" ? "نقدی" : tx.method === "wire" ? "حواله" : "حواله‌ای"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold">{tx.amount.toLocaleString()}</span>
                        {statusBadge(tx.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit/Withdrawal Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{txType === "deposit" ? "درخواست واریز" : "درخواست برداشت"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>مبلغ</Label>
                <Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="مبلغ را وارد کنید" className="font-mono" dir="ltr" min="1" />
              </div>
              <div className="space-y-2">
                <Label>روش</Label>
                <Select value={txMethod} onValueChange={setTxMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدی</SelectItem>
                    <SelectItem value="wire">حواله بانکی</SelectItem>
                    <SelectItem value="hawala">حواله‌ای</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="توضیحات (اختیاری)" />
              </div>
              <Button className="w-full" onClick={handleSubmitTx} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                ثبت درخواست
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Wallets;
