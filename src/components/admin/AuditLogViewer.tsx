import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ClipboardList, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  rate_update: "بروزرسانی نرخ",
  kyc_approve: "تأیید KYC",
  kyc_reject: "رد KYC",
  user_kyc_update: "تغییر وضعیت KYC",
};

const entityLabels: Record<string, string> = {
  exchange_rate: "نرخ ارز",
  profile: "پروفایل",
  user: "کاربر",
};

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50) as { data: AuditLog[] | null; error: any };

      if (error) {
        toast.error("خطا در دریافت لاگ‌ها");
      } else {
        setLogs(data || []);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-primary" />
        لاگ فعالیت‌ها
      </h2>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right">عملیات</TableHead>
                <TableHead className="text-right">نوع موجودیت</TableHead>
                <TableHead className="text-right">جزئیات</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-border">
                  <TableCell>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entityLabels[log.entity_type] || log.entity_type}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.details && Object.keys(log.details).length > 0
                      ? JSON.stringify(log.details).slice(0, 80)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("fa-IR")}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">لاگی ثبت نشده است</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
