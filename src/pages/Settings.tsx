import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Phone, MapPin, Save, Loader2, LogOut } from "lucide-react";

const Settings = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    address: "",
    kyc_status: "pending",
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        kyc_status: data.kyc_status || "pending",
      });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.rpc("update_own_profile", {
      _full_name: profile.full_name || null,
      _phone: profile.phone || null,
      _address: profile.address || null,
    } as any);

    if (error) {
      toast.error("خطا در ذخیره اطلاعات");
    } else {
      toast.success("اطلاعات با موفقیت ذخیره شد");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("رمز عبور و تکرار آن مطابقت ندارند");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: passwords.newPassword,
    });

    if (error) {
      toast.error("خطا در تغییر رمز عبور");
    } else {
      toast.success("رمز عبور با موفقیت تغییر یافت");
      setPasswords({ newPassword: "", confirmPassword: "" });
    }
    setChangingPassword(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const kycLabel = profile.kyc_status === "verified" ? "تأیید شده ✅" : profile.kyc_status === "rejected" ? "رد شده ❌" : "در انتظار بررسی ⏳";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">تنظیمات حساب</h1>

        {/* Profile Info */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              اطلاعات شخصی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ایمیل</Label>
              <Input value={user?.email || ""} disabled className="text-left font-mono opacity-60" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>نام کامل</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="نام و نام خانوادگی" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />شماره تلفن</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+93 7XX XXX XXX" dir="ltr" className="text-left font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" />آدرس</Label>
              <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="شهر و آدرس" />
            </div>
            <div className="space-y-2">
              <Label>وضعیت KYC</Label>
              <p className="text-sm text-muted-foreground">{kycLabel}</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
              ذخیره تغییرات
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              تغییر رمز عبور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>رمز عبور جدید</Label>
              <Input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} placeholder="حداقل ۶ کاراکتر" dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label>تکرار رمز عبور</Label>
              <Input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} placeholder="تکرار رمز عبور جدید" dir="ltr" className="text-left" />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline" className="w-full">
              {changingPassword ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Lock className="h-4 w-4 ml-2" />}
              تغییر رمز عبور
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button onClick={handleSignOut} variant="destructive" className="w-full">
          <LogOut className="h-4 w-4 ml-2" />
          خروج از حساب کاربری
        </Button>
      </main>
    </div>
  );
};

export default Settings;
