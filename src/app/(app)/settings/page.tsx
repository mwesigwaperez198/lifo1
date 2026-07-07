import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreatePrefs } from "@/lib/ai";
import { SettingsForm } from "@/components/SettingsForm";
import { SectionHeader } from "@/components/Glass";
import { Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const prefs = await getOrCreatePrefs(user.id);

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Manage your profile, customise Chloe and secure your account." icon={<SettingsIcon size={18} />} />
      <SettingsForm
        user={{
          fullName: user.fullName,
          bio: user.bio,
          avatar: user.avatar,
          currency: user.currency,
          monthlyIncome: user.monthlyIncome,
          theme: user.theme,
          accentColor: user.accentColor,
          twoFactorEnabled: user.twoFactorEnabled,
        }}
        prefs={{ aiName: prefs.aiName, avatar: prefs.avatar, personality: prefs.personality, themeColor: prefs.themeColor, voice: prefs.voice }}
      />
    </div>
  );
}
