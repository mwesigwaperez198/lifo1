"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useApiMutation, useSubmit, qk } from "@/lib/query";
import { Modal, Field, SubmitBtn, FormError } from "./Modals";
import { Progress, Badge } from "./Glass";
import { GOAL_CATEGORIES, PRIORITIES, categoryMeta } from "@/lib/constants";
import { toInputDate, money, formatDate, daysUntil, toNum } from "@/lib/format";
import type { Goal } from "@/db/schema";
import { Plus, Pencil, Trash2, Check, CalendarClock } from "lucide-react";

function GoalFields({ g }: { g?: Partial<Goal> }) {
  return (
    <div className="space-y-3">
      <Field label="Title">
        <input className="input" name="title" defaultValue={g?.title ?? ""} required placeholder="e.g. Buy a gaming laptop" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select className="select" name="category" defaultValue={g?.category ?? "Technology"}>
            {GOAL_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className="select" name="priority" defaultValue={g?.priority ?? "medium"}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.icon} {p.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Target amount">
          <input className="input" name="targetAmount" type="number" min="0" step="any" defaultValue={g?.targetAmount ?? "0"} />
        </Field>
        <Field label="Saved so far">
          <input className="input" name="currentAmount" type="number" min="0" step="any" defaultValue={g?.currentAmount ?? "0"} />
        </Field>
      </div>
      <Field label="Deadline">
        <input className="input" name="deadline" type="date" defaultValue={g?.deadline ? toInputDate(g.deadline) : ""} />
      </Field>
      <Field label="Notes">
        <textarea className="textarea" name="description" defaultValue={g?.description ?? ""} />
      </Field>
    </div>
  );
}

export function CreateGoalButton() {
  const [open, setOpen] = useState(false);
  const s = useSubmit();
  const create = useApiMutation(
    (data: Record<string, string>) => api("/api/goals", { method: "POST", body: data }),
    { invalidate: [qk.goals] }
  );

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> New Goal
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create a goal">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            const ok = await s.run(() => create.mutateAsync(data));
            if (ok) setOpen(false);
          }}
        >
          <GoalFields />
          <FormError error={s.error} />
          <SubmitBtn loading={s.loading} full>
            Create goal
          </SubmitBtn>
        </form>
      </Modal>
    </>
  );
}

export function GoalCard({ goal }: { goal: Goal }) {
  const [edit, setEdit] = useState(false);
  const cat = categoryMeta(goal.category);
  const d = daysUntil(goal.deadline);
  const done = goal.status === "completed";
  const tgt = toNum(goal.targetAmount);
  const cur = toNum(goal.currentAmount);
  const prog = tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) : goal.progress ?? 0;
  const prio = PRIORITIES.find((p) => p.value === goal.priority) ?? PRIORITIES[1];

  const patch = useApiMutation(
    ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api(`/api/goals/${id}`, { method: "PATCH", body }),
    { invalidate: [qk.goals] }
  );

  const del = useApiMutation(
    (id: number) => api(`/api/goals/${id}`, { method: "DELETE" }),
    { invalidate: [qk.goals] }
  );

  const complete = () => {
    patch.mutate({ id: goal.id, body: { status: done ? "active" : "completed" } });
  };

  const remove = () => {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    del.mutate(goal.id);
  };

  return (
    <div className="glass p-4 hover-lift fade-up" style={done ? { opacity: 0.7 } : undefined}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl grid place-items-center text-xl shrink-0" style={{ background: `color-mix(in srgb, ${cat.color} 20%, transparent)`, color: cat.color }}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold ${done ? "line-through" : ""}`}>{goal.title}</h3>
            {done && <Badge tone="var(--success)">✅ Done</Badge>}
            <Badge tone={prio.color}>{prio.icon} {prio.label}</Badge>
          </div>
          {goal.description && <p className="text-sm text-soft mt-1 line-clamp-2">{goal.description}</p>}

          {(tgt > 0 || prog > 0) && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-soft mb-1">
                <span>{money(cur)} of {money(tgt)}</span>
                <span className="font-semibold">{prog}%</span>
              </div>
              <Progress value={prog} />
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-muted flex-wrap">
            {goal.deadline && (
              <span className="inline-flex items-center gap-1" style={d !== null && d < 0 && !done ? { color: "var(--danger)" } : undefined}>
                <CalendarClock size={13} /> {formatDate(goal.deadline)}
                {d !== null && !done && (d < 0 ? ` · ${Math.abs(d)}d overdue` : d <= 7 ? ` · in ${d}d` : "")}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button className="btn btn-sm btn-ghost" onClick={complete}>
              <Check size={14} /> {done ? "Reopen" : "Complete"}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setEdit(true)}>
              <Pencil size={14} /> Edit
            </button>
            <button className="btn btn-sm btn-danger" onClick={remove}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title="Edit goal">
        <GoalEditForm goal={goal} onDone={() => setEdit(false)} />
      </Modal>
    </div>
  );
}

function GoalEditForm({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const s = useSubmit();
  const patch = useApiMutation(
    ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api(`/api/goals/${id}`, { method: "PATCH", body }),
    { invalidate: [qk.goals] }
  );

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const ok = await s.run(() => patch.mutateAsync({ id: goal.id, body: data }));
        if (ok) onDone();
      }}
    >
      <GoalFields g={goal} />
      <FormError error={s.error} />
      <SubmitBtn loading={s.loading} full>
        Save changes
      </SubmitBtn>
    </form>
  );
}
