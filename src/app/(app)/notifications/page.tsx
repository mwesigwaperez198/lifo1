"use client";
import { api } from "@/lib/client";
import { useApiQuery, useApiMutation, qk } from "@/lib/query";
import { SectionHeader, Spinner, EmptyState } from "@/components/Glass";
import { Bell, Check, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/format";

type Notif = { id: number; type: string; title: string; message: string | null; read: boolean; link: string | null; createdAt: string };

const TYPE_TONE: Record<string, string> = {
  achievement: "#f59e0b",
  deadline: "#f43f5e",
  reminder: "#3b82f6",
  price_drop: "#10b981",
  system: "var(--accent)",
};

export default function NotificationsPage() {
  const { data, isLoading } = useApiQuery<{ notifications: Notif[]; unread: number }>(
    qk.notifications,
    "/api/notifications"
  );

  const markAll = useApiMutation(
    () => api("/api/notifications", { method: "POST", body: { all: true } }),
    { invalidate: [qk.notifications] }
  );

  const remove = useApiMutation(
    (id: number) => api(`/api/notifications?id=${id}`, { method: "DELETE" }),
    { invalidate: [qk.notifications] }
  );

  const items = data?.notifications ?? null;
  const unread = data?.unread ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        subtitle="Deadlines, price drops, achievements and reminders."
        icon={<Bell size={18} />}
        action={unread > 0 ? <button className="btn btn-ghost btn-sm" onClick={() => markAll.mutate()}><Check size={14} /> Mark all read</button> : undefined}
      />

      {isLoading ? (
        <div className="glass p-10 grid place-items-center"><Spinner className="w-6 h-6" /></div>
      ) : !items || items.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up. New alerts will appear here." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const tone = TYPE_TONE[n.type] || "var(--accent)";
            return (
              <div key={n.id} className="glass p-4 flex items-start gap-3 fade-up" style={!n.read ? { borderLeft: `3px solid ${tone}` } : undefined}>
                <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${tone} 18%, transparent)`, color: tone }}>
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full" style={{ background: tone }} />}
                  </div>
                  {n.message && <p className="text-sm text-soft mt-0.5">{n.message}</p>}
                  <div className="text-[0.7rem] text-muted mt-1">{timeAgo(n.createdAt)}</div>
                </div>
                <button className="btn-icon btn btn-ghost btn-sm" onClick={() => remove.mutate(n.id)}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
