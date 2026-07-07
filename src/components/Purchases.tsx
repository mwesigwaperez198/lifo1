"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useApiMutation, useSubmit, qk } from "@/lib/query";
import { Modal, Field, SubmitBtn, FormError } from "./Modals";
import { Badge } from "./Glass";
import { PRIORITIES, PURCHASE_STATUSES, categoryMeta } from "@/lib/constants";
import { toInputDate, money, formatDate, toNum } from "@/lib/format";
import type { Purchase } from "@/db/schema";
import { Plus, Pencil, Trash2, ExternalLink, Tag } from "lucide-react";

function PurchaseFields({ p }: { p?: Partial<Purchase> }) {
  return (
    <div className="space-y-3">
      <Field label="Product name">
        <input className="input" name="productName" defaultValue={p?.productName ?? ""} required placeholder="e.g. Sony WH-1000XM5" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select className="select" name="category" defaultValue={p?.category ?? "Technology"}>
            {["Technology", "Home", "Fashion", "Gaming", "Health", "Education", "General"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className="select" name="priority" defaultValue={p?.priority ?? "medium"}>
            {PRIORITIES.map((pr) => (
              <option key={pr.value} value={pr.value}>{pr.icon} {pr.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Desired price"><input className="input" name="desiredPrice" type="number" min="0" step="any" defaultValue={p?.desiredPrice ?? "0"} /></Field>
        <Field label="Current price"><input className="input" name="currentPrice" type="number" min="0" step="any" defaultValue={p?.currentPrice ?? "0"} /></Field>
      </div>
      <Field label="Product link"><input className="input" name="link" type="url" defaultValue={p?.link ?? ""} placeholder="https://..." /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Image URL"><input className="input" name="image" type="url" defaultValue={p?.image ?? ""} placeholder="https://..." /></Field>
        <Field label="Buy by"><input className="input" name="deadline" type="date" defaultValue={p?.deadline ? toInputDate(p.deadline) : ""} /></Field>
      </div>
    </div>
  );
}

export function CreatePurchaseButton() {
  const [open, setOpen] = useState(false);
  const s = useSubmit();
  const create = useApiMutation(
    (data: Record<string, string>) => api("/api/purchases", { method: "POST", body: data }),
    { invalidate: [qk.purchases] }
  );

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add Product
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a product">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            const ok = await s.run(() => create.mutateAsync(data));
            if (ok) setOpen(false);
          }}
        >
          <PurchaseFields />
          <FormError error={s.error} />
          <SubmitBtn loading={s.loading} full>Add product</SubmitBtn>
        </form>
      </Modal>
    </>
  );
}

export function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const [edit, setEdit] = useState(false);
  const cat = categoryMeta(purchase.category);
  const desired = toNum(purchase.desiredPrice);
  const current = toNum(purchase.currentPrice);
  const status = PURCHASE_STATUSES.find((s) => s.value === purchase.status) ?? PURCHASE_STATUSES[0];
  const prio = PRIORITIES.find((p) => p.value === purchase.priority) ?? PRIORITIES[1];
  const dropped = desired > 0 && current > 0 && current < desired;

  const patch = useApiMutation(
    ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api(`/api/purchases/${id}`, { method: "PATCH", body }),
    { invalidate: [qk.purchases] }
  );

  const remove = useApiMutation(
    (id: number) => api(`/api/purchases/${id}`, { method: "DELETE" }),
    { invalidate: [qk.purchases] }
  );

  const cycle = () => {
    const order = ["wishlist", "planned", "bought"] as const;
    const idx = order.indexOf((purchase.status as (typeof order)[number]) ?? "wishlist");
    const next = order[(idx + 1) % order.length];
    patch.mutate({ id: purchase.id, body: { status: next } });
  };

  const del = () => {
    if (!confirm("Remove this product?")) return;
    remove.mutate(purchase.id);
  };

  return (
    <div className="glass p-4 hover-lift fade-up overflow-hidden flex flex-col text-center">
      <div className="relative w-full h-32 rounded-xl mb-3 grid place-items-center text-4xl overflow-hidden" style={{ background: "var(--surface-2)" }}>
        {purchase.image ? <img src={purchase.image} alt="" className="w-full h-full object-cover" /> : cat.icon}
        {dropped && (
          <span className="absolute top-2 right-2"><Badge tone="var(--success)"><Tag size={11} /> ↓ {Math.round(((desired - current) / desired) * 100)}%</Badge></span>
        )}
      </div>
      <h3 className="font-bold leading-tight">{purchase.productName}</h3>

      <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
        <Badge tone={prio.color}>{prio.icon} {prio.label}</Badge>
        <Badge>{cat.icon} {purchase.category}</Badge>
      </div>

      <div className="flex items-center justify-center gap-2 mt-3 text-sm">
        <span className="font-bold">{money(current || desired)}</span>
        {desired > 0 && current > 0 && current > desired && (
          <span className="text-xs" style={{ color: "var(--warning)" }}>↑ above target</span>
        )}
      </div>
      {purchase.deadline && <div className="text-xs text-muted mt-2">📅 {formatDate(purchase.deadline)}</div>}

      <div className="flex gap-1.5 mt-auto pt-3">
        {purchase.link && (
          <a href={purchase.link} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost flex-1"><ExternalLink size={14} /> Open</a>
        )}
        <button className="btn btn-sm btn-ghost" onClick={cycle}>{status.icon} {status.label}</button>
        <button className="btn btn-sm btn-ghost" onClick={() => setEdit(true)}><Pencil size={14} /></button>
        <button className="btn btn-sm btn-danger" onClick={del}><Trash2 size={14} /></button>
      </div>
      <Modal open={edit} onClose={() => setEdit(false)} title="Edit product">
        <PurchaseEditForm purchase={purchase} onDone={() => setEdit(false)} />
      </Modal>
    </div>
  );
}

function PurchaseEditForm({ purchase, onDone }: { purchase: Purchase; onDone: () => void }) {
  const s = useSubmit();
  const patch = useApiMutation(
    ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api(`/api/purchases/${id}`, { method: "PATCH", body }),
    { invalidate: [qk.purchases] }
  );

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const ok = await s.run(() => patch.mutateAsync({ id: purchase.id, body: data }));
        if (ok) onDone();
      }}
    >
      <PurchaseFields p={purchase} />
      <FormError error={s.error} />
      <SubmitBtn loading={s.loading} full>Save changes</SubmitBtn>
    </form>
  );
}

export function AddPriceButton({ purchaseId, name }: { purchaseId: number; name: string }) {
  const [open, setOpen] = useState(false);
  const s = useSubmit();
  const addPrice = useApiMutation(
    (data: Record<string, unknown>) => api("/api/prices", { method: "POST", body: data }),
    { invalidate: [qk.prices(purchaseId), qk.purchases] }
  );

  return (
    <>
      <button className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}><Plus size={14} /> Add price</button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Track price · ${name}`}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            const ok = await s.run(() => addPrice.mutateAsync({ ...fd, purchaseId }));
            if (ok) setOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Store"><input className="input" name="store" required placeholder="Amazon" /></Field>
            <Field label="Price"><input className="input" name="price" type="number" min="0" step="any" required /></Field>
          </div>
          <Field label="Store URL (optional)"><input className="input" name="url" type="url" /></Field>
          <FormError error={s.error} />
          <SubmitBtn loading={s.loading} full>Save price</SubmitBtn>
        </form>
      </Modal>
    </>
  );
}
