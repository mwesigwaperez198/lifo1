import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell, type ShellUser } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shell: ShellUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar,
    role: user.role ?? "user",
    theme: user.theme ?? "dark",
    accentColor: user.accentColor ?? "#7c3aed",
  };

  return <AppShell user={shell}>{children}</AppShell>;
}
