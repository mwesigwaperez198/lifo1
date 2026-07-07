"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useApiMutation, useSubmit, qk } from "@/lib/query";
import { Modal, Field, SubmitBtn, FormError } from "./Modals";
import { money, formatDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

export function SavingsButton() {
  const [open, setOpen] = useState(false);
  const s = useSubmit();
  const create = useApiMutation(
    (data: Record<string, string>) => api("/api/savings", { method: "POST", body: data }),
    { invalidate: [qk.goals] }
  );

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Log Savings</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log a savings deposit">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            const ok = await s.run(() => create.mutateAsync(data));
            if (ok) setOpen(false);
          }}
        >
          <Field label="Amount"><input className="input" name="amount" type="number" min="0" step="any" required /></Field>
          <Field label="Note (optional)"><input className="input" name="note" placeholder="e.g. Monthly auto-transfer" /></Field>
          <FormError error={s.error} />
          <SubmitBtn loading={s.loading} full>Log savings</SubmitBtn>
        </form>
      </Modal>
    </>
  );
}

export function ExpenseButton() {
  const [open, setOpen] = useState(false);
  const s = useSubmit();
  const create = useApiMutation(
    (data: Record<string, string>) => api("/api/expenses", { method: "POST", body: data }),
    { invalidate: [qk.goals] }
  );

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}><Plus size={16} /> Add Expense</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log an expense">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            const ok = await s.run(() => create.mutateAsync(data));
            if (ok) setOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount"><input className="input" name="amount" type="number" min="0" step="any" required /></Field>
            <Field label="Category">
              <select className="select" name="category" defaultValue="General">
                {["General", "Food", "Rent", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description (optional)"><input className="input" name="description" /></Field>
          <Field label="Date"><input className="input" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <FormError error={s.error} />
          <SubmitBtn loading={s.loading} full>Add expense</SubmitBtn>
        </form>
      </Modal>
    </>
  );
}

export function DeleteRow({ kind, id }: { kind: "savings" | "expenses"; id: number }) {
  const remove = useApiMutation(
    ({ kind, id }: { kind: string; id: number }) => api(`/api/${kind}?id=${id}`, { method: "DELETE" }),
    { invalidate: [qk.goals] }
  );

  return (
    <button
      className="btn-icon btn btn-ghost btn-sm"
      onClick={() => remove.mutate({ kind, id })}
    >
      <Trash2 size={14} />
    </button>
  );
}

export { money, formatDate };
