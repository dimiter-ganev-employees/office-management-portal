import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/cash")({
  head: () => ({
    meta: [
      { title: "Каса | Фирма" },
      { name: "description", content: "Дневна каса – доставки от каса и от други източници" },
      { property: "og:title", content: "Каса | Фирма" },
      { property: "og:description", content: "Дневна каса – доставки от каса и от други източници" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CashPage,
});

type Delivery = { id: number; supplier_id: number; amount: number; from_cash: boolean; counterparty: { name: string } | null };
type Supplier = { id: number; name: string };
const inputCls = "rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const money = (n: number) => n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = (n: number) => String(n).padStart(2, "0");

function CashPage() {
  const today = new Date();
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const daysInMonth = new Date(year, month, 0).getDate();
  const d = Math.min(day, daysInMonth);
  const dateStr = `${year}-${pad(month)}-${pad(d)}`;

  const [rows, setRows] = useState<Delivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("deliveries").select("id, supplier_id, amount, from_cash, counterparty(name)").eq("delivery_date", dateStr).order("id");
    if (error) setError(error.message); else { setError(null); setRows((data ?? []) as unknown as Delivery[]); }
  }, [dateStr]);
  useEffect(() => { void load(); }, [load]);

  const cash = useMemo(() => rows.filter((r) => r.from_cash), [rows]);
  const other = useMemo(() => rows.filter((r) => !r.from_cash), [rows]);
  const sum = (l: Delivery[]) => l.reduce((s, r) => s + Number(r.amount), 0);

  const years = Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <h1 className="mr-4 text-3xl font-bold text-foreground">Каса</h1>
        <label className="text-sm text-muted-foreground">Ден
          <select className={`${inputCls} ml-2`} value={d} onChange={(e) => setDay(+e.target.value)}>
            {Array.from({ length: daysInMonth }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">Месец
          <select className={`${inputCls} ml-2`} value={month} onChange={(e) => setMonth(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">Година
          <select className={`${inputCls} ml-2`} value={year} onChange={(e) => setYear(+e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Доставки</h2>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Добави</button>
          </div>
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-2">ID</th><th className="py-2 pr-2">Доставчик</th><th className="py-2 pr-2 text-right">Сума</th><th className="py-2">От каса</th>
            </tr></thead>
            <tbody>
              {cash.map((r) => <DRow key={r.id} r={r} />)}
              <tr className="border-b bg-muted font-semibold text-foreground"><td colSpan={2} className="py-2 pr-2">Обща сума от Каса</td><td className="py-2 pr-2 text-right">{money(sum(cash))}</td><td /></tr>
              {other.map((r) => <DRow key={r.id} r={r} />)}
              <tr className="bg-muted font-semibold text-foreground"><td colSpan={2} className="py-2 pr-2">Обща сума от други</td><td className="py-2 pr-2 text-right">{money(sum(other))}</td><td /></tr>
            </tbody>
          </table>
        </section>
        <section className="min-h-64 rounded-lg border bg-card p-4" />
      </div>
      {adding && <AddDialog date={dateStr} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />}
    </div>
  );
}

function DRow({ r }: { r: Delivery }) {
  return (
    <tr className="border-b text-foreground">
      <td className="py-2 pr-2">{r.id}</td>
      <td className="py-2 pr-2">{r.counterparty?.name ?? ""}</td>
      <td className="py-2 pr-2 text-right">{money(Number(r.amount))}</td>
      <td className="py-2">{r.from_cash ? "Да" : "Не"}</td>
    </tr>
  );
}

function AddDialog({ date, onClose, onSaved }: { date: string; onClose: () => void; onSaved: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState("");
  const [amount, setAmount] = useState("");
  const [fromCash, setFromCash] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    void supabase.from("counterparty").select("id, name").eq("active", true).order("name").then(({ data }) => setSuppliers(data ?? []));
  }, []);
  const save = async () => {
    const a = Number(amount.replace(",", "."));
    if (!supplier) return setErr("Изберете доставчик.");
    if (!amount.trim() || !Number.isFinite(a)) return setErr("Въведете валидна сума.");
    setSaving(true);
    const { error } = await supabase.from("deliveries").insert({ delivery_date: date, supplier_id: +supplier, amount: Math.round(a * 100) / 100, from_cash: fromCash });
    setSaving(false);
    if (error) setErr(error.message); else onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Нова доставка</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-foreground">Доставчик *
            <select className={`${inputCls} mt-1 w-full`} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">— изберете —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block text-sm text-foreground">Сума *
            <input type="number" step="0.01" className={`${inputCls} mt-1 w-full`} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block text-sm text-foreground">От каса
            <select className={`${inputCls} mt-1 w-full`} value={fromCash ? "1" : "0"} onChange={(e) => setFromCash(e.target.value === "1")}>
              <option value="1">Да</option><option value="0">Не</option>
            </select>
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm text-foreground hover:bg-accent">Отказ</button>
          <button disabled={saving} onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Запази</button>
        </div>
      </div>
    </div>
  );
}
