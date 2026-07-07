"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/client";
import { Spinner } from "@/components/Glass";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/forgot", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={sent ? "Check your inbox." : "Enter your email and we'll send you a reset link."}
      footer={<><Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Back to login</Link></>}
    >
      {sent ? (
        <div className="text-center py-4 space-y-3">
          <div className="text-5xl">📧</div>
          <h3 className="font-bold text-lg">Email sent</h3>
          <p className="text-sm text-soft">
            We sent a password reset link to <strong className="text-foreground">{email}</strong>.
            Check your inbox and click the link to set a new password.
          </p>
          <p className="text-xs text-muted">Didn&apos;t get it? Check your spam folder, or try again in a few minutes.</p>
        </div>
      ) : (
        <form onSubmit={requestReset} className="space-y-3">
          <label className="label">Account email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading && <Spinner />} Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}
