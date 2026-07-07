import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreatePrefs, getRecentConversation } from "@/lib/ai";
import { grantAchievements } from "@/lib/data";
import { db } from "@/db";
import { aiMemory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SectionHeader } from "@/components/Glass";
import { ChatBox } from "@/components/ChatBox";
import { personalityMeta } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { Sparkles, Brain, Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";

const CAPABILITIES = [
  "Analyses your goals & savings",
  "Predicts completion dates",
  "Suggests priorities & strategies",
  "Spots price drops & abandoned goals",
  "Remembers your habits & brands",
  "Motivates you when you need it",
];

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await grantAchievements(user.id).catch(() => {});

  const [prefs, conversation, memory] = await Promise.all([
    getOrCreatePrefs(user.id),
    getRecentConversation(user.id, 24),
    db.select().from(aiMemory).where(eq(aiMemory.userId, user.id)).orderBy(desc(aiMemory.updatedAt)).limit(10),
  ]);

  const meta = personalityMeta(prefs.personality);
  const initial = conversation.map((c) => ({ role: c.role, content: c.content }));

  return (
    <div className="space-y-6">
      <SectionHeader title="Chloe · AI Companion" subtitle="Your personal life-assistant with long-term memory." icon={<Sparkles size={18} />} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChatBox prefs={{ aiName: prefs.aiName, avatar: prefs.avatar, personality: prefs.personality, themeColor: prefs.themeColor }} initial={initial} />
        </div>

        <div className="space-y-4">
          <div className="glass p-5 fade-up" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${prefs.themeColor || "var(--accent)"} 16%, transparent), transparent)` }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl" style={{ background: prefs.themeColor || "var(--accent)" }}>{prefs.avatar || "✨"}</div>
              <div>
                <div className="font-bold">{prefs.aiName}</div>
                <div className="text-xs text-soft">{meta.emoji} {meta.name} personality</div>
              </div>
            </div>
            <p className="text-xs text-soft mt-3">{meta.description} Rename, restyle or switch personality anytime in Settings.</p>
          </div>

          <div className="glass p-5 fade-up fade-up-1">
            <h3 className="font-bold flex items-center gap-2 mb-3"><Brain size={16} style={{ color: "var(--accent)" }} /> What {prefs.aiName} remembers</h3>
            {memory.length === 0 ? (
              <p className="text-sm text-muted">No memories yet. Tell {prefs.aiName} what you want to buy, your budget, or your income — it&apos;ll remember between sessions.</p>
            ) : (
              <div className="space-y-2">
                {memory.map((m) => (
                  <div key={m.id} className="text-sm glass-soft p-2.5">
                    <div className="text-[0.65rem] uppercase tracking-wide text-muted font-semibold">{(m.category ?? "general").replace(/_/g, " ")}</div>
                    <div className="mt-0.5">{m.memoryValue}</div>
                    <div className="text-[0.65rem] text-muted mt-0.5">{timeAgo(m.updatedAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass p-5 fade-up fade-up-2">
            <h3 className="font-bold flex items-center gap-2 mb-3"><Lightbulb size={16} style={{ color: "var(--accent)" }} /> Capabilities</h3>
            <ul className="space-y-1.5 text-sm text-soft">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-start gap-2"><span style={{ color: "var(--accent)" }}>✦</span> {c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
