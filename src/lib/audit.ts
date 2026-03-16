import { supabase } from "@/integrations/supabase/client";

interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export const logAuditEvent = async (entry: AuditLogEntry) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id || null,
    details: entry.details || {},
  } as any);
};
