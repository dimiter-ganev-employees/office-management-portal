import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";

type Rev = { id: number; problem_id: number; amount: number; revision_date: string; problems: { name: string; credit: boolean } | null };
const inputCls = "rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const money = (n: number) => n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r2 = (n: number) => Math.round(n * 100) / 100;

export function RevisionPanel({ date, cashTotal }: { date: string; cashTotal: number }) {
  const [rows, setRows] = useState<Rev[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("revisions").select("id, problem_id, amount, revision_date, problems(name, credit)").eq("revision_date", date).order("id");
    if (error) setError(error.message); else { setError(null); setRows((data ?? []) as unknown as Rev[]); }
  }, [date]);
  useEffect(() => { void load(); }, [load]);

  const ops1 = useMemo(() => rows.filter((r) => r.problems?.credit), [rows]);
  const ops2 = useMemo(() => rows.filter((r) => !r.problems?.credit), [rows]);
  const sum = (l: Rev[]) => r2(l.reduce((s, r) => s + Number(r.amount), 0));
  const s1 = sum(ops1), s2 = sum(ops2);
  const kasa = r2(s1 + cashTotal);
  const turnover = r2(kasa - s2);

  const Total = ({ label, value }: { label: string; value: number }) => (
    <tr className="border-b bg-muted font-semibold text-foreground"><td colSpan={2} className="py-2 pr-2">{label}</td><td className="py-2 text-right">{money(value)}</td></tr>
  );
  const Row = ({ r }: { r: Rev }) => (
    <tr className="border-b text-foreground"><td className="py-2 pr-2">{r.id}</td><td className="py-2 pr-2">{r.problems?.name ?? ""}</td><td className="py-2 text-right">{money(Number(r.amount))}</td></tr>
  );

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Ревизия</h2>
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Добави</button>
      </div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-muted-foreground">
          <th className="py-2 pr-2">ID</th><th className="py-2 pr-2">Операция</th><th className="py-2">Сума</th>
        </tr></thead>
        <tbody>
          {ops1.map((r) => <Row key={r.id} r={r} />)}
          <Total label="Обща сума Операции1" value={s1} />
          {ops2.map((r) => <Row key={r.id} r={r} />)}
          <Total label="Обща сума Операции2" value={s2} />
          <Total label="Обща сума Операции1" value={s1} />
          <Total label="Обща Сума Доставки" value={cashTotal} />
          <Total label="Обща Сума от Каса" value={kasa} />
          <Total label="Обща сума Операции2" value={r2(-s2)} />
          <Total label="Оборот" value={turnover} />
        </tbody>
      </table>
      {adding && <AddDialog date={date} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />}
    </section>
  );
}

function AddDialog({ date, onClose, onSaved }: { date: string; onClose: () => void; onSaved: () => void }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [problems, setProblems] = useState<{ id: number; name: string }[]>([]);
  const [problem, setProblem] = useState("");
  const [amount, setAmount] = useState("");
  const [revDate, setRevDate] = useState(todayStr);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  void date;
  useEffect(() => {
    void supabase.from("problems").select("id, name").eq("active", true).order("name").then(({ data }) => setProblems(data ?? []));
  }, []);
  const save = async () => {
    const a = Number(amount.replace(",", "."));
    if (!problem) return setErr("Изберете операция.");
    if (!amount.trim() || !Number.isFinite(a)) return setErr("Въведете валидна сума.");
    if (!revDate) return setErr("Въведете дата.");
    setSaving(true);
    const { error } = await supabase.from("revisions").insert({ problem_id: +problem, amount: r2(a), revision_date: revDate });
    setSaving(false);
    if (error) setErr(error.message); else onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Нова ревизия</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-foreground">Операция *
            <select className={`${inputCls} mt-1 w-full`} value={problem} onChange={(e) => setProblem(e.target.value)}>
              <option value="">— изберете —</option>
              {problems.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block text-sm text-foreground">Сума *
            <input type="number" step="0.01" className={`${inputCls} mt-1 w-full`} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block text-sm text-foreground">Дата *
            <input type="date" className={`${inputCls} mt-1 w-full`} value={revDate} onChange={(e) => setRevDate(e.target.value)} />
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
