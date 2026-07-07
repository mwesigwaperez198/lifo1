"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/client";
import { Spinner } from "@/components/Glass";

function ResetForm() {
  const params = useSearchParams();
  const tokenParam = params.get("token") ?? "";
  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/forgot", { method: "PUT", body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={done ? "Password updated" : "Set new password"}
      subtitle={done ? "You can now sign in with your new password." : "Paste the token from your email and choose a new password."}
      footer={<><Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Back to login</Link></>}
    >
      {done ? (
        <div className="text-center py-4">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="font-bold text-lg">All set!</h3>
          <p className="text-sm text-soft mt-1">Your password has been updated.</p>
          <Link href="/login" className="btn btn-primary mt-4 inline-flex">Go to login</Link>
        </div>
      ) : (
        <form onSubmit={reset} className="space-y-3">
          <label className="label">Reset token</label>
          <input
            className="input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="Paste the token from your email"
          />
          <label className="label">New password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min 6 characters"
            minLength={6}
          />
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>{loading && <Spinner />} Update password</button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted">Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
