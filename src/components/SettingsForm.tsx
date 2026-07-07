"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/client";
import { useApiMutation, useSubmit, qk } from "@/lib/query";
import { Field, SubmitBtn, FormError, Modal } from "./Modals";
import { Spinner } from "./Glass";
import { PERSONALITIES, AI_AVATARS, ACCENT_COLORS } from "@/lib/constants";
import { Check, User, Sparkles, Shield, QrCode, Lock, AlertTriangle } from "lucide-react";

const AV_EMOJIS = ["🙂", "😎", "🚀", "🌟", "🐱", "🐼", "🦊", "👾", "🤖", "🌸", "🔥", "💎"];

export function SettingsForm({
  user,
  prefs,
}: {
  user: {
    fullName: string;
    bio: string | null;
    avatar: string | null;
    currency: string | null;
    monthlyIncome: string | null;
    theme: string | null;
    accentColor: string | null;
    twoFactorEnabled: boolean | null;
  };
  prefs: { aiName: string | null; avatar: string | null; personality: string | null; themeColor: string | null; voice: string | null } | null;
}) {
  const s = useSubmit();
  const [tab, setTab] = useState<"profile" | "companion" | "security">("profile");
  const [theme, setTheme] = useState(user.theme === "light" ? "light" : "dark");
  const [accent, setAccent] = useState(user.accentColor || "#7c3aed");
  const [userAvatar, setUserAvatar] = useState(user.avatar || "🙂");
  const [aiName, setAiName] = useState(prefs?.aiName || "Chloe");
  const [aiAvatar, setAiAvatar] = useState(prefs?.avatar || "✨");
  const [personality, setPersonality] = useState(prefs?.personality || "friendly");
  const [aiTheme, setAiTheme] = useState(prefs?.themeColor || "#7c3aed");
  const [saved, setSaved] = useState(false);

  const saveSettings = useApiMutation(
    (data: Record<string, string>) => api("/api/settings", { method: "POST", body: data }),
    { invalidate: [qk.settings] }
  );

  const setup2FA = useApiMutation(
    () => api<{ secret: string; qr: string }>("/api/auth/2fa/setup", { method: "POST" })
  );

  const verify2FA = useApiMutation(
    (body: { secret: string; token: string }) => api("/api/auth/2fa/verify", { method: "POST", body }),
    { invalidate: [qk.settings] }
  );

  const disable2FA = useApiMutation(
    (body: { password: string }) => api("/api/auth/2fa/disable", { method: "POST", body }),
    { invalidate: [qk.settings] }
  );

  // 2FA setup state
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [setup2FAError, setSetup2FAError] = useState<string | null>(null);

  // 2FA disable state
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disable2FAError, setDisable2FAError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("lg_theme", theme); } catch { /* */ }
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    try { localStorage.setItem("lg_accent", accent); } catch { /* */ }
  }, [accent]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "companion", label: "Chloe AI", icon: Sparkles },
    { id: "security", label: "Security", icon: Shield },
  ] as const;

  const startSetup2FA = async () => {
    setSetup2FAError(null);
    try {
      const d = await setup2FA.mutateAsync();
      setTotpSecret(d.secret);
      setQrDataUrl(d.qr);
      setShowSetup2FA(true);
    } catch (err) {
      setSetup2FAError(err instanceof Error ? err.message : "Failed to start 2FA setup");
    }
  };

  const confirmSetup2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetup2FAError(null);
    try {
      await verify2FA.mutateAsync({ secret: totpSecret, token: totpCode });
      setShowSetup2FA(false);
      setQrDataUrl(null);
      setTotpSecret("");
      setTotpCode("");
    } catch (err) {
      setSetup2FAError(err instanceof Error ? err.message : "Invalid code");
    }
  };

  const disable2FAHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisable2FAError(null);
    try {
      await disable2FA.mutateAsync({ password: disablePassword });
      setShowDisable2FA(false);
      setDisablePassword("");
    } catch (err) {
      setDisable2FAError(err instanceof Error ? err.message : "Failed to disable 2FA");
    }
  };

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
          data.theme = theme;
          data.accentColor = accent;
          data.avatar = userAvatar;
          data.aiName = aiName;
          data.aiAvatar = aiAvatar;
          data.personality = personality;
          data.aiThemeColor = aiTheme;
          const ok = await s.run(() => saveSettings.mutateAsync(data));
          if (ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }
        }}
      >
        <input type="hidden" name="theme" value={theme} />
        <input type="hidden" name="accentColor" value={accent} />

        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-ghost"}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "profile" && (
          <div className="glass p-5 space-y-4 fade-up">
            <Field label="Full name"><input className="input" name="fullName" defaultValue={user.fullName} /></Field>
            <Field label="Bio"><textarea className="textarea" name="bio" defaultValue={user.bio ?? ""} /></Field>
            <Field label="Avatar">
              <div className="flex gap-2 flex-wrap">
                {AV_EMOJIS.map((em) => (
                  <button key={em} type="button" onClick={() => setUserAvatar(em)}
                    className={`w-10 h-10 rounded-xl text-xl grid place-items-center transition ${userAvatar === em ? "btn-primary" : "btn-ghost"}`}>
                    {em}{userAvatar === em && <Check size={12} />}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency"><input className="input" name="currency" defaultValue={user.currency || "USD"} maxLength={6} /></Field>
              <Field label="Monthly income"><input className="input" name="monthlyIncome" type="number" min="0" step="any" defaultValue={user.monthlyIncome || "0"} /></Field>
            </div>
            <Field label="App theme">
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTheme(t)} className={`btn btn-sm capitalize ${theme === t ? "btn-primary" : "btn-ghost"}`}>
                    {t === "dark" ? "🌙" : "☀️"} {t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Accent color">
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setAccent(c)}
                    className="w-9 h-9 rounded-full grid place-items-center" style={{ background: c, outline: accent === c ? "2px solid var(--text)" : "none", outlineOffset: 2 }}>
                    {accent === c && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {tab === "companion" && (
          <div className="glass p-5 space-y-4 fade-up">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `color-mix(in srgb, ${aiTheme} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${aiTheme} 35%, transparent)` }}>
              <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl" style={{ background: aiTheme }}>{aiAvatar}</div>
              <div>
                <div className="font-bold">{aiName}</div>
                <div className="text-xs text-soft">{PERSONALITIES.find((p) => p.slug === personality)?.name} mode</div>
              </div>
            </div>
            <Field label="Companion name" hint="Saved permanently — your AI will always use this name.">
              <input className="input" value={aiName} onChange={(e) => setAiName(e.target.value)} maxLength={40} />
            </Field>
            <Field label="Avatar">
              <div className="flex gap-2 flex-wrap">
                {AI_AVATARS.map((em) => (
                  <button key={em} type="button" onClick={() => setAiAvatar(em)} className={`w-10 h-10 rounded-xl text-xl grid place-items-center ${aiAvatar === em ? "btn-primary" : "btn-ghost"}`}>{em}</button>
                ))}
              </div>
            </Field>
            <Field label="Personality">
              <div className="grid sm:grid-cols-2 gap-2">
                {PERSONALITIES.map((p) => (
                  <button key={p.slug} type="button" onClick={() => setPersonality(p.slug)}
                    className="text-left p-3 rounded-xl transition" style={personality === p.slug ? { background: `color-mix(in srgb, var(--accent) 18%, transparent)`, border: `1px solid color-mix(in srgb, var(--accent) 40%, transparent)` } : { background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="font-semibold text-sm">{p.emoji} {p.name}</div>
                    <div className="text-xs text-soft">{p.description}</div>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Companion theme color">
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setAiTheme(c)} className="w-9 h-9 rounded-full grid place-items-center" style={{ background: c, outline: aiTheme === c ? "2px solid var(--text)" : "none", outlineOffset: 2 }}>
                    {aiTheme === c && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Voice (future)" hint="Voice synthesis is reserved for a future release.">
              <select className="select" name="voice" defaultValue={prefs?.voice || "soft"}>
                {["soft", "warm", "energetic", "calm", "professional"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
          </div>
        )}

        {tab === "security" && (
          <div className="glass p-5 space-y-4 fade-up">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Current password"><input className="input" name="currentPassword" type="password" autoComplete="current-password" /></Field>
              <Field label="New password"><input className="input" name="newPassword" type="password" autoComplete="new-password" /></Field>
            </div>
            <Field label="Login PIN (4–6 digits)" hint="Enables fast PIN login. Leave blank to remove.">
              <input className="input" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4,6}" placeholder="••••" />
            </Field>

            {/* 2FA section */}
            <div className="p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: user.twoFactorEnabled ? "color-mix(in srgb, var(--success) 18%, transparent)" : "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                    {user.twoFactorEnabled ? <Lock size={18} style={{ color: "var(--success)" }} /> : <Shield size={18} style={{ color: "var(--accent)" }} />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Two-factor authentication</div>
                    <div className="text-xs text-soft">
                      {user.twoFactorEnabled ? "Enabled — your account has an extra layer of security." : "Add an extra layer of security with an authenticator app."}
                    </div>
                  </div>
                </div>
                {user.twoFactorEnabled ? (
                  <button type="button" onClick={() => setShowDisable2FA(true)} className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }}>
                    Disable
                  </button>
                ) : (
                  <button type="button" onClick={startSetup2FA} disabled={setup2FA.isPending} className="btn btn-sm btn-primary">
                    {setup2FA.isPending ? <Spinner className="w-3.5 h-3.5" /> : <QrCode size={14} />} Set up
                  </button>
                )}
              </div>
              {setup2FAError && <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>{setup2FAError}</p>}
            </div>

            <div className="p-3 rounded-xl text-xs text-soft" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              🔒 Your data is protected with bcrypt password hashing, prepared statements, CSRF tokens, secure httpOnly sessions, rate limiting and full audit logging.
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <SubmitBtn loading={s.loading}>Save changes</SubmitBtn>
          {saved && <span className="text-sm inline-flex items-center gap-1" style={{ color: "var(--success)" }}><Check size={14} /> Saved!</span>}
        </div>
        <FormError error={s.error} />
      </form>

      {/* 2FA Setup Modal */}
      <Modal open={showSetup2FA} onClose={() => setShowSetup2FA(false)} title="Set up 2FA">
        <div className="space-y-4">
          <p className="text-sm text-soft">Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.).</p>
          {qrDataUrl && (
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="2FA QR Code" className="rounded-xl" style={{ width: 200, height: 200 }} />
            </div>
          )}
          <div className="p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-[0.65rem] uppercase tracking-wide text-muted font-semibold mb-1">Manual entry key</div>
            <code className="text-xs font-mono break-all">{totpSecret}</code>
          </div>
          <form onSubmit={confirmSetup2FA} className="space-y-3">
            <label className="label">Enter the 6-digit code from your app</label>
            <input
              className="input text-center text-lg tracking-[0.3em] font-mono"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
            />
            {setup2FAError && <p className="text-sm" style={{ color: "var(--danger)" }}>{setup2FAError}</p>}
            <button className="btn btn-primary w-full" disabled={verify2FA.isPending || totpCode.length !== 6}>
              {verify2FA.isPending && <Spinner />} Enable 2FA
            </button>
          </form>
        </div>
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal open={showDisable2FA} onClose={() => setShowDisable2FA(false)} title="Disable 2FA">
        <form onSubmit={disable2FAHandler} className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)" }}>
            <AlertTriangle size={16} style={{ color: "var(--danger)" }} />
            <span>This will remove the extra security layer from your account.</span>
          </div>
          <label className="label">Current password</label>
          <input
            className="input"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoFocus
          />
          {disable2FAError && <p className="text-sm" style={{ color: "var(--danger)" }}>{disable2FAError}</p>}
          <button className="btn btn-primary w-full" disabled={disable2FA.isPending || !disablePassword} style={{ background: "var(--danger)" }}>
            {disable2FA.isPending && <Spinner />} Disable 2FA
          </button>
        </form>
      </Modal>
    </>
  );
}

