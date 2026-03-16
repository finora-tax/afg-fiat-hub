import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, UserCheck, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/audit";

interface UserProfile {
  id: string; user_id: string; full_name: string | null; phone: string | null;
  kyc_status: string | null; created_at: string; address: string | null;
}

const getKycBadge = (status: string | null) => {
  switch (status) {
    case "verified": return <Badge className="bg-primary/20 text-primary border-primary/30">تأیید شده</Badge>;
    case "pending": return <Badge className="bg-accent/20 text-accent border-accent/30">در انتظار</Badge>;
    case "rejected": return <Badge className="bg-destructive/20 text-destructive border-destructive/30">رد شده</Badge>;
    default: return <Badge variant="secondary">نامشخص</Badge>;
  }
};

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("خطا در دریافت لیست کاربران"); }
    else { setUsers(data || []); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter((user) =>
    (user.full_name || "").includes(searchQuery) || (user.phone || "").includes(searchQuery)
  );

  const handleUpdateKyc = async (userId: string, userName: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ kyc_status: status }).eq("user_id", userId);
    if (error) {
      toast.error("خطا در بروزرسانی وضعیت");
    } else {
      toast.success("وضعیت کاربر بروزرسانی شد");
      await logAuditEvent({
        action: "user_kyc_update",
        entity_type: "user",
        entity_id: userId,
        details: { user_name: userName, new_status: status },
      });
      fetchUsers();
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">مدیریت کاربران</h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="جستجوی کاربر..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 w-64" />
        </div>
      </div>
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg">لیست کاربران ({filteredUsers.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">تلفن</TableHead>
                <TableHead className="text-right">آدرس</TableHead>
                <TableHead className="text-right">KYC</TableHead>
                <TableHead className="text-right">تاریخ عضویت</TableHead>
                <TableHead className="text-right">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{user.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{user.address || "—"}</TableCell>
                  <TableCell>{getKycBadge(user.kyc_status)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString("fa-IR")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateKyc(user.user_id, user.full_name || "", "verified")} className="text-primary">
                          <UserCheck className="h-4 w-4 ml-2" />تأیید KYC
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateKyc(user.user_id, user.full_name || "", "rejected")} className="text-destructive">
                          <UserX className="h-4 w-4 ml-2" />رد KYC
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">کاربری یافت نشد</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
