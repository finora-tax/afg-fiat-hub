import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("لطفاً ایمیل خود را وارد کنید");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error("خطا در ارسال لینک بازیابی");
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">بازیابی رمز عبور</h1>
          <p className="text-muted-foreground text-sm mt-1">لینک بازیابی به ایمیل شما ارسال می‌شود</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle>{sent ? "ایمیل ارسال شد" : "فراموشی رمز عبور"}</CardTitle>
            <CardDescription>
              {sent
                ? "لطفاً صندوق ورودی ایمیل خود را بررسی کنید"
                : "ایمیل ثبت‌شده خود را وارد کنید"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  اگر حساب کاربری با ایمیل <strong>{email}</strong> وجود داشته باشد، لینک بازیابی ارسال شده است.
                </p>
                <Link to="/auth">
                  <Button variant="outline" className="w-full mt-4">
                    <ArrowRight className="h-4 w-4 ml-2" />
                    بازگشت به صفحه ورود
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="pr-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  ارسال لینک بازیابی
                </Button>
                <Link to="/auth" className="block text-center">
                  <Button variant="link" className="text-sm text-muted-foreground">
                    بازگشت به صفحه ورود
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
