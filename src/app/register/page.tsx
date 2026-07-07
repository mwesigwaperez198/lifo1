"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/client";
import { Spinner } from "@/components/Glass";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", username: "", password: "", pin: "" });
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/register", { method: "POST", body: { ...form, rememberMe: remember } });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking goals, savings and smart purchases in minutes."
      footer={<>Already have an account? <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.fullName} onChange={set("fullName")} placeholder="Alex Carter" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={set("username")} placeholder="alex" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required />
          </div>
          <div>
            <label className="label">PIN <span className="text-muted">(optional)</span></label>
            <input className="input" type="password" inputMode="numeric" value={form.pin} onChange={set("pin")} placeholder="4–6 digits" pattern="[0-9]{4,6}" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-soft">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16 }} /> Keep me signed in
        </label>
        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading && <Spinner />} Create account</button>
        <p className="text-[0.7rem] text-muted text-center">By signing up you agree to our Terms. Your password is hashed with bcrypt.</p>
      </form>
    </AuthShell>
  );
}
