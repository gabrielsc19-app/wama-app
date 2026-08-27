import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

type Notice = {
  tenantId: string;
  caseId: string;
  actorId: string;
  recipientIds: Iterable<string | null | undefined>;
  type: string;
  title: string;
  body: string;
};

export type OperationsNotificationSummary = {
  inAppRecipients: number;
  pushDevices: number;
  pushSent: number;
  pushFailed: number;
};

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;

  const publicKey =
    process.env.VAPID_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:contacto@wamaapp.com";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function createOperationsNotifications(
  admin: SupabaseClient,
  notice: Notice,
): Promise<OperationsNotificationSummary> {
  const summary: OperationsNotificationSummary = {
    inAppRecipients: 0,
    pushDevices: 0,
    pushSent: 0,
    pushFailed: 0,
  };

  const recipientIds = [
    ...new Set([...notice.recipientIds].filter((id): id is string => Boolean(id))),
  ].filter((id) => id !== notice.actorId);

  if (!recipientIds.length) return summary;

  const { data: licensed } = await admin
    .from("wama_module_user_assignments")
    .select(
      "profile_id,wama_tenant_module_licenses!inner(tenant_id,wama_module_catalog!inner(module_key))",
    )
    .in("profile_id", recipientIds)
    .eq("status", "active")
    .eq("wama_tenant_module_licenses.tenant_id", notice.tenantId)
    .eq(
      "wama_tenant_module_licenses.wama_module_catalog.module_key",
      "operations",
    );

  const allowed = new Set((licensed || []).map((row) => row.profile_id));
  if (!allowed.size) return summary;

  const rows = [...allowed].map((recipient_profile_id) => ({
    tenant_id: notice.tenantId,
    case_id: notice.caseId,
    recipient_profile_id,
    notification_type: notice.type,
    title: notice.title,
    body: notice.body,
  }));

  const { error: notificationError } = await admin
    .from("wama_operations_notifications")
    .insert(rows);

  if (!notificationError) {
    summary.inAppRecipients = rows.length;
  } else {
    console.error("No se pudieron crear avisos WAMA:", notificationError);
  }

  if (!configureVapid()) return summary;

  const { data: subscriptions } = await admin
    .from("wama_operations_push_subscriptions")
    .select("id,profile_id,subscription")
    .eq("tenant_id", notice.tenantId)
    .in("profile_id", [...allowed])
    .is("revoked_at", null);

  if (!subscriptions?.length) return summary;

  summary.pushDevices = subscriptions.length;

  const results = await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          JSON.stringify({
            title: notice.title,
            body: notice.body,
            icon: "/wama-icon-192.png",
            badge: "/wama-icon-192.png",
            tag: `wama-case-${notice.caseId}`,
            url: `/operations-hub?case=${encodeURIComponent(notice.caseId)}`,
            data: {
              caseId: notice.caseId,
              url: `/operations-hub?case=${encodeURIComponent(notice.caseId)}`,
            },
          }),
        );
        return true;
      } catch (error) {
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          await admin
            .from("wama_operations_push_subscriptions")
            .update({ revoked_at: new Date().toISOString() })
            .eq("id", row.id);
        } else {
          console.error("No se pudo enviar push WAMA:", error);
        }
        return false;
      }
    }),
  );

  summary.pushSent = results.filter(Boolean).length;
  summary.pushFailed = results.length - summary.pushSent;

  return summary;
}
