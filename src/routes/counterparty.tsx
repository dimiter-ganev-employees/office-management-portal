import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDown, ArrowUp, ArrowUpDown, Ban, CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/counterparty")({
  head: () => ({
    meta: [
      { title: "Контрагенти | Фирма" },
      { name: "description", content: "Списък с контрагенти – добавяне, редакция, деактивиране и изтриване" },
      { property: "og:title", content: "Контрагенти | Фирма" },
      { property: "og:description", content: "Списък с контрагенти – добавяне, редакция, деактивиране и изтриване" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CounterpartyPage,
});

type Row = { id: number; name: string; phone: string | null; contact_person: string | null; active: boolean; comment: string | null };
type Key = "id" | "name" | "phone" | "contact_person" | "active" | "comment";
const cols: [Key, string][] = [["id", "ID"], ["name", "Име"], ["phone", "Телефон"], ["contact_person", "Лице за контакт"], ["active", "Активен"], ["comment", "Коментар"]];
type Dialog = { mode: "add" } | { mode: "edit"; row: Row } | { mode: "delete"; row: Row } | null;
const inputCls = "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const text = (r: Row, k: Key) => (k === "active" ? (r.active ? "Да" : "Не") : String(r[k] ?? ""));

function CounterpartyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<Key>("id");
  const [asc, setAsc] = useState(true);
  const [filters, setFilters] = useState<Record<Key, string>>({ id: "", name: "", phone: "", contact_person: "", active: "", comment: "" });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState({ name: "", phone: "", contact_person: "", active: true, comment: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("counterparty").select("id, name, phone, contact_person, active, comment").order("id");
    if (error) setError(error.message); else setRows(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const f = rows.filter((r) => cols.every(([k]) => {
      const q = filters[k].trim().toLowerCase();
      if (!q) return true;
      if (k === "active") return text(r, k) === (q === "1" || q === "да" ? "Да" : q === "0" || q === "не" ? "Не" : q);
      return text(r, k).toLowerCase().includes(q);
    }));
    const d = asc ? 1 : -1;
    return [...f].sort((a, b) => {
      if (sortKey === "id") return (a.id - b.id) * d;
      if (sortKey === "active") return (Number(a.active) - Number(b.active)) * d;
      return text(a, sortKey).localeCompare(text(b, sortKey), "bg") * d;
    });
  }, [rows, filters, sortKey, asc]);

  const open = (d: NonNullable<Dialog>) => {
    setFormError(null);
    if (d.mode === "add") setForm({ name: "", phone: "", contact_person: "", active: true, comment: "" });
    if (d.mode === "edit") setForm({ name: d.row.name, phone: d.row.phone ?? "", contact_person: d.row.contact_person ?? "", active: d.row.active, comment: d.row.comment ?? "" });
    setDialog(d);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) return setFormError("Полето „Име“ е задължително.");
    setSaving(true);
    const payload = { name, phone: form.phone.trim() || null, contact_person: form.contact_person.trim() || null, active: form.active, comment: form.comment.trim() || null };
    const res = dialog?.mode === "edit"
      ? await supabase.from("counterparty").update(payload).eq("id", dialog.row.id)
      : await supabase.from("counterparty").insert(payload);
    setSaving(false);
    if (res.error) return setFormError(res.error.message);
    setDialog(null);
    await load();
  };

  const toggleActive = async (r: Row) => {
    const { error } = await supabase.from("counterparty").update({ active: !r.active }).eq("id", r.id);
    if (error) setError(error.message); else await load();
  };

  const remove = async (r: Row) => {
    setSaving(true);
    const { error } = await supabase.from("counterparty").delete().eq("id", r.id);
    setSaving(false);
    if (error) return setFormError(error.message);
    setDialog(null);
    await load();
  };

  const sortBy = (k: Key) => { if (k === sortKey) setAsc((a) => !a); else { setSortKey(k); setAsc(true); } };
  const btn = "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Контрагенти</h1>
        <button onClick={() => open({ mode: "add" })} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Добавяне
        </button>
      </div>
      {error && <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              {cols.map(([k, l]) => (
                <th key={k} className="px-3 py-3">
                  <button onClick={() => sortBy(k)} className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary">
                    {l} {sortKey !== k ? <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" /> : asc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  </button>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-semibold text-foreground">Действия</th>
            </tr>
            <tr className="border-b bg-muted/20">
              {cols.map(([k]) => (
                <th key={k} className="px-3 py-2">
                  {k === "active" ? (
                    <select value={filters.active} onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value }))} className="w-full rounded-md border bg-background px-2 py-1 text-xs font-normal text-foreground">
                      <option value="">Всички</option><option value="1">Да</option><option value="0">Не</option>
                    </select>
                  ) : (
                    <input value={filters[k]} onChange={(e) => setFilters((f) => ({ ...f, [k]: e.target.value }))} placeholder="Филтър..." className="w-full rounded-md border bg-background px-2 py-1 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  )}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Зареждане...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Няма намерени контрагенти.</td></tr>
            ) : visible.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-3 text-muted-foreground">{r.id}</td>
                <td className="px-3 py-3 font-medium text-foreground">{r.name}</td>
                <td className="px-3 py-3 text-muted-foreground">{r.phone ?? "—"}</td>
                <td className="px-3 py-3 text-muted-foreground">{r.contact_person ?? "—"}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.active ? "Да" : "Не"}</span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{r.comment ?? "—"}</td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1 whitespace-nowrap">
                    <button onClick={() => open({ mode: "edit", row: r })} className={`${btn} text-foreground hover:bg-accent`}><Pencil className="h-3.5 w-3.5" /> Редактиране</button>
                    <button onClick={() => toggleActive(r)} className={`${btn} text-foreground hover:bg-accent`}>
                      {r.active ? <><Ban className="h-3.5 w-3.5" /> Деактивиране</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Активиране</>}
                    </button>
                    <button onClick={() => open({ mode: "delete", row: r })} className={`${btn} text-destructive hover:bg-destructive/10`}><Trash2 className="h-3.5 w-3.5" /> Изтриване</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setDialog(null)}>
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {dialog.mode === "add" ? "Нов контрагент" : dialog.mode === "edit" ? "Редактиране на контрагент" : "Изтриване на контрагент"}
              </h2>
              <button onClick={() => setDialog(null)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            {dialog.mode === "delete" ? (
              <div className="space-y-4">
                <p className="text-sm text-foreground">Сигурни ли сте, че искате да изтриете „{dialog.row.name}“?</p>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDialog(null)} className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">Отказ</button>
                  <button onClick={() => remove(dialog.row)} disabled={saving} className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50">Изтрий</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Име <span className="text-destructive">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} autoFocus />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Телефон</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Лице за контакт</label>
                  <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Активен</label>
                  <select value={form.active ? "1" : "0"} onChange={(e) => setForm({ ...form, active: e.target.value === "1" })} className={inputCls}>
                    <option value="1">Да</option><option value="0">Не</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Коментар</label>
                  <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className={`${inputCls} min-h-20`} />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDialog(null)} className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">Отказ</button>
                  <button onClick={save} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? "Запис..." : "Запис"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
