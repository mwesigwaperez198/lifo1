"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Spinner } from "./Glass";

export function useRefresh() {
  const router = useRouter();
  return () => router.refresh();
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className={`glass relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto no-scrollbar fade-up`}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--glass-bg)" }}>
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="btn-icon btn-ghost btn">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[0.7rem] text-muted mt-1">{hint}</p>}
    </div>
  );
}

export function useSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setLoading(false);
    }
  };
  return { loading, error, run };
}

export function SubmitBtn({ loading, children, full }: { loading: boolean; children: ReactNode; full?: boolean }) {
  return (
    <button disabled={loading} className={`btn btn-primary ${full ? "w-full" : ""}`} type="submit">
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="text-sm" style={{ color: "var(--danger)" }}>
      {error}
    </p>
  );
}

export function onSubmitHandler(
  e: FormEvent<HTMLFormElement>,
  action: (data: Record<string, string>) => Promise<void>
) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
  return action(data);
}
