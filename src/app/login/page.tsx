"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/client";
import { Spinner } from "@/components/Glass";
import { Fingerprint, ScanFace, Eye, Mail, KeyRound, ShieldCheck, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"password" | "pin">("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [future, setFuture] = useState<string | null>(null);

  // 2FA state
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const d = await api<{ requiresTwoFactor?: boolean }>("/api/auth/login", {
        method: "POST",
        body: { method, identifier, password, pin, rememberMe: remember },
      });
      if (d.requiresTwoFactor) {
        setRequiresTwoFactor(true);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      await api("/api/auth/2fa/confirm", { method: "POST", body: { token: twoFACode } });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setTwoFAError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setTwoFALoading(false);
    }
  };

  const futureBtns = [
    { icon: Fingerprint, label: "Biometric" },
    { icon: ScanFace, label: "Face ID" },
    { icon: Eye, label: "Eye Scan" },
  ];

  if (requiresTwoFactor) {
    return (
      <AuthShell
        title="Two-factor authentication"
        subtitle="Enter the 6-digit code from your authenticator app."
        footer={<><Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Back to login</Link></>}
      >
        <form onSubmit={confirmTwoFactor} className="space-y-3">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl grid place-items-center" style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
              <ShieldAlert size={28} style={{ color: "var(--accent)" }} />
            </div>
          </div>
          <label className="label">Verification code</label>
          <input
            className="input text-center text-lg tracking-[0.3em] font-mono"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
          />
          {twoFAError && <p className="text-sm" style={{ color: "var(--danger)" }}>{twoFAError}</p>}
          <button className="btn btn-primary w-full" disabled={twoFALoading || twoFACode.length !== 6}>
            {twoFALoading && <Spinner />} Verify & continue
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue building your future."
      footer={<>New here? <Link href="/register" className="font-semibold" style={{ color: "var(--accent)" }}>Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="label">Email or username</div>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com" required />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => setMethod("password")} className={`btn btn-sm flex-1 ${method === "password" ? "btn-primary" : "btn-ghost"}`}><KeyRound size={14} /> Password</button>
          <button type="button" onClick={() => setMethod("pin")} className={`btn btn-sm flex-1 ${method === "pin" ? "btn-primary" : "btn-ghost"}`}>🔢 PIN</button>
        </div>

        {method === "password" ? (
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        ) : (
          <input className="input" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4–6 digit PIN" pattern="[0-9]{4,6}" required />
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-soft">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16 }} /> Remember me
          </label>
          <Link href="/forgot-password" className="text-soft hover:underline">Forgot password?</Link>
        </div>

        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

        <button className="btn btn-primary w-full" disabled={loading}>{loading && <Spinner />} Sign in</button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        <span className="text-xs text-muted">or future-ready login</span>
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {futureBtns.map((b) => {
          const Icon = b.icon;
          return (
            <button key={b.label} type="button" onClick={() => setFuture(`${b.label} login is a future-ready placeholder — hardware integration coming soon.`)} className="btn btn-ghost flex-col gap-1 py-3" style={{ flexDirection: "column" }}>
              <Icon size={18} />
              <span className="text-[0.65rem]">{b.label}</span>
            </button>
          );
        })}
      </div>
      {future && (
        <p className="text-xs text-soft mt-3 p-2.5 rounded-lg flex items-start gap-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} /> {future}
        </p>
      )}
    </AuthShell>
  );
}
