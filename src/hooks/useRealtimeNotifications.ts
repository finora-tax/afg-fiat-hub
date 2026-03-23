import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  completed: "تکمیل شد ✅",
  cancelled: "لغو شد ❌",
  failed: "ناموفق ❗",
  pending: "در انتظار ⏳",
};

export const useRealtimeNotifications = () => {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for transfer status changes (for regular users)
    const transferChannel = supabase
      .channel("user-transfers")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transfers",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          const oldStatus = (payload.old as any).status;
          if (newStatus !== oldStatus) {
            toast.info(`وضعیت حواله تغییر کرد: ${statusLabels[newStatus] || newStatus}`, {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    // Admin-only: listen for new transfers and KYC changes
    let adminChannel: ReturnType<typeof supabase.channel> | null = null;
    if (isAdmin) {
      adminChannel = supabase
        .channel("admin-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transfers",
          },
          (payload) => {
            const transfer = payload.new as any;
            toast.info(
              `حواله جدید: ${transfer.amount} ${transfer.from_currency} → ${transfer.to_currency}`,
              { duration: 5000 }
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
          },
          (payload) => {
            const oldKyc = (payload.old as any).kyc_status;
            const newKyc = (payload.new as any).kyc_status;
            if (oldKyc !== newKyc && newKyc === "pending") {
              toast.info("درخواست KYC جدید دریافت شد", { duration: 5000 });
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(transferChannel);
      if (adminChannel) {
        supabase.removeChannel(adminChannel);
      }
    };
  }, [user, isAdmin]);
};
