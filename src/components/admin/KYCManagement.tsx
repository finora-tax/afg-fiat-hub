import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, XCircle, Clock, User, Phone, MapPin, Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  kyc_status: string | null;
  created_at: string;
}

const getStatusIcon = (status: string | null) => {
  switch (status) {
    case "verified":
      return <CheckCircle className="h-5 w-5 text-primary" />;
    case "rejected":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Clock className="h-5 w-5 text-accent" />;
  }
};

export const KYCManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطا در دریافت اطلاعات");
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: "verified" })
      .eq("user_id", userId);

    if (error) {
      toast.error("خطا در تأیید KYC");
    } else {
      toast.success("درخواست KYC تأیید شد");
      fetchProfiles();
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("لطفاً دلیل رد را وارد کنید");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: "rejected" })
      .eq("user_id", userId);

    if (error) {
      toast.error("خطا در رد KYC");
    } else {
      toast.success("درخواست KYC رد شد");
      setRejectionReason("");
      fetchProfiles();
    }
  };

  const pendingProfiles = profiles.filter(p => p.kyc_status === "pending");
  const verifiedProfiles = profiles.filter(p => p.kyc_status === "verified");
  const rejectedProfiles = profiles.filter(p => p.kyc_status === "rejected");

  const KycCard = ({ profile }: { profile: Profile }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{profile.full_name || "بدون نام"}</h3>
              <p className="text-sm text-muted-foreground">{new Date(profile.created_at).toLocaleDateString("fa-IR")}</p>
            </div>
          </div>
          {getStatusIcon(profile.kyc_status)}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" dir="ltr">{profile.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{profile.address || "—"}</span>
          </div>
        </div>

        {profile.kyc_status === "pending" && (
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Button onClick={() => handleApprove(profile.user_id)} size="sm" className="bg-primary hover:bg-primary/90">
              <CheckCircle className="h-4 w-4 ml-2" />
              تأیید
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 ml-2" />
                  رد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>رد درخواست KYC</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>دلیل رد</Label>
                    <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="دلیل رد درخواست را وارد کنید..." />
                  </div>
                  <Button onClick={() => handleReject(profile.user_id)} variant="destructive" className="w-full">
                    تأیید رد درخواست
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">مدیریت احراز هویت (KYC)</h2>
        <Badge className="bg-accent/20 text-accent border-accent/30">
          {pendingProfiles.length} در انتظار
        </Badge>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending"><Clock className="h-4 w-4 ml-1" />در انتظار ({pendingProfiles.length})</TabsTrigger>
          <TabsTrigger value="verified"><CheckCircle className="h-4 w-4 ml-1" />تأیید شده ({verifiedProfiles.length})</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="h-4 w-4 ml-1" />رد شده ({rejectedProfiles.length})</TabsTrigger>
        </TabsList>

        {[
          { value: "pending", data: pendingProfiles },
          { value: "verified", data: verifiedProfiles },
          { value: "rejected", data: rejectedProfiles },
        ].map(({ value, data }) => (
          <TabsContent key={value} value={value} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.map((profile) => <KycCard key={profile.id} profile={profile} />)}
              {data.length === 0 && (
                <p className="text-muted-foreground col-span-2 text-center py-8">درخواستی وجود ندارد</p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
