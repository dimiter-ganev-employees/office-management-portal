import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/problems")({
  head: () => ({
    meta: [
      { title: "Проблеми | Фирма" },
      {
        name: "description",
        content: "Списък с проблеми – добавяне, редакция, деактивиране и изтриване",
      },
      { property: "og:title", content: "Проблеми | Фирма" },
      {
        property: "og:description",
        content: "Списък с проблеми – добавяне, редакция, деактивиране и изтриване",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProblemsPage,
});

type Row = {
  id: number;
  name: string;
  active: boolean;
  credit: boolean;
  by_pc: boolean;
  post_terminal: boolean;
  comment: string | null;
};
type Key = "id" | "name" | "active" | "credit" | "by_pc" | "post_terminal" | "comment";
type Dialog =
  | { mode: "add" }
  | { mode: "edit"; row: Row }
  | { mode: "delete"; row: Row }
  | null;

const cols: [Key, string][] = [
  ["id", "ID"],
  ["name", "Име"],
  ["active", "Активен"],
  ["credit", "Кредит"],
  ["by_pc", "по PC"],
  ["post_terminal", "Пост Терминал"],
  ["comment", "Коментар"],
];
const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const text = (row: Row, key: Key) =>
  key === "active" ||
  key === "credit" ||
  key === "by_pc" ||
  key === "post_terminal"
    ? row[key]
      ? "Да"
      : "Не"
    : String(row[key] ?? "");

function ProblemsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<Key>("id");
  const [asc, setAsc] = useState(true);
  const [filters, setFilters] = useState<Record<Key, string>>({
    id: "",
    name: "",
    active: "",
    credit: "",
    by_pc: "",
    post_terminal: "",
    comment: "",
  });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState({
    name: "",
    active: true,
    credit: false,
    by_pc: false,
    post_terminal: false,
    comment: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("problems")
      .select("id, name, active, credit, by_pc, post_terminal, comment")
      .order("id");
    if (loadError) setError(loadError.message);
    else {
      setError(null);
      setRows(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const filtered = rows.filter((row) =>
      cols.every(([key]) => {
        const query = filters[key].trim().toLowerCase();
        if (!query) return true;
        if (
          key === "active" ||
          key === "credit" ||
          key === "by_pc" ||
          key === "post_terminal"
        ) {
          const expected =
            query === "1" || query === "да"
              ? "Да"
              : query === "0" || query === "не"
                ? "Не"
                : query;
          return text(row, key) === expected;
        }
        return text(row, key).toLowerCase().includes(query);
      }),
    );
    const direction = asc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "id") return (a.id - b.id) * direction;
      if (
        sortKey === "active" ||
        sortKey === "credit" ||
        sortKey === "by_pc" ||
        sortKey === "post_terminal"
      )
        return (Number(a[sortKey]) - Number(b[sortKey])) * direction;
      return text(a, sortKey).localeCompare(text(b, sortKey), "bg") * direction;
    });
  }, [rows, filters, sortKey, asc]);

  const open = (nextDialog: NonNullable<Dialog>) => {
    setFormError(null);
    if (nextDialog.mode === "add")
      setForm({
        name: "",
        active: true,
        credit: false,
        by_pc: false,
        post_terminal: false,
        comment: "",
      });
    if (nextDialog.mode === "edit")
      setForm({
        name: nextDialog.row.name,
        active: nextDialog.row.active,
        credit: nextDialog.row.credit,
        by_pc: nextDialog.row.by_pc,
        post_terminal: nextDialog.row.post_terminal,
        comment: nextDialog.row.comment ?? "",
      });
    setDialog(nextDialog);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) return setFormError("Полето „Име“ е задължително.");
    setSaving(true);
    const payload = {
      name,
      active: form.active,
      credit: form.credit,
      by_pc: form.by_pc,
      post_terminal: form.post_terminal,
      comment: form.comment.trim() || null,
    };
    const result =
      dialog?.mode === "edit"
        ? await supabase.from("problems").update(payload).eq("id", dialog.row.id)
        : await supabase.from("problems").insert(payload);
    setSaving(false);
    if (result.error) return setFormError(result.error.message);
    setDialog(null);
    await load();
  };

  const toggleActive = async (row: Row) => {
    const { error: updateError } = await supabase
      .from("problems")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (updateError) setError(updateError.message);
    else await load();
  };

  const remove = async (row: Row) => {
    setSaving(true);
    const { error: deleteError } = await supabase
      .from("problems")
      .delete()
      .eq("id", row.id);
    setSaving(false);
    if (deleteError) return setFormError(deleteError.message);
    setDialog(null);
    await load();
  };

  const sortBy = (key: Key) => {
    if (key === sortKey) setAsc((value) => !value);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };
  const btn =
    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Проблеми</h1>
        <button
          onClick={() => open({ mode: "add" })}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Добавяне
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              {cols.map(([key, label]) => (
                <th key={key} className="px-3 py-3">
                  <button
                    onClick={() => sortBy(key)}
                    className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                  >
                    {label}{" "}
                    {sortKey !== key ? (
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : asc ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-semibold text-foreground">
                Действия
              </th>
            </tr>
            <tr className="border-b bg-muted/20">
              {cols.map(([key]) => (
                <th key={key} className="px-3 py-2">
                  {key === "active" ||
                  key === "credit" ||
                  key === "by_pc" ||
                  key === "post_terminal" ? (
                    <select
                      aria-label={`Филтър по ${
                        cols.find(([column]) => column === key)?.[1]
                      }`}
                      value={filters[key]}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border bg-background px-2 py-1 text-xs font-normal text-foreground"
                    >
                      <option value="">Всички</option>
                      <option value="1">Да</option>
                      <option value="0">Не</option>
                    </select>
                  ) : (
                    <input
                      aria-label={`Филтър по ${cols.find(([column]) => column === key)?.[1]}`}
                      value={filters[key]}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      placeholder="Филтър..."
                      className="w-full rounded-md border bg-background px-2 py-1 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  )}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Зареждане...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Няма намерени проблеми.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-3 text-muted-foreground">{row.id}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.active ? "Да" : "Не"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.credit
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.credit ? "Да" : "Не"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.by_pc
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.by_pc ? "Да" : "Не"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.post_terminal
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.post_terminal ? "Да" : "Не"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {row.comment ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1 whitespace-nowrap">
                      <button
                        onClick={() => open({ mode: "edit", row })}
                        className={`${btn} text-foreground hover:bg-accent`}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Редактиране
                      </button>
                      <button
                        onClick={() => toggleActive(row)}
                        className={`${btn} text-foreground hover:bg-accent`}
                      >
                        {row.active ? (
                          <>
                            <Ban className="h-3.5 w-3.5" /> Деактивиране
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Активиране
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => open({ mode: "delete", row })}
                        className={`${btn} text-destructive hover:bg-destructive/10`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Изтриване
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          onClick={() => setDialog(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              dialog.mode === "add"
                ? "Нов проблем"
                : dialog.mode === "edit"
                  ? "Редактиране на проблем"
                  : "Изтриване на проблем"
            }
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {dialog.mode === "add"
                  ? "Нов проблем"
                  : dialog.mode === "edit"
                    ? "Редактиране на проблем"
                    : "Изтриване на проблем"}
              </h2>
              <button
                aria-label="Затваряне"
                onClick={() => setDialog(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {dialog.mode === "delete" ? (
              <div className="space-y-4">
                <p className="text-sm text-foreground">
                  Сигурни ли сте, че искате да изтриете „{dialog.row.name}“?
                </p>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDialog(null)}
                    className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Отказ
                  </button>
                  <button
                    onClick={() => remove(dialog.row)}
                    disabled={saving}
                    className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
                  >
                    Изтрий
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Име <span className="text-destructive">*</span>
                  </label>
                  <input
                    aria-label="Име"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Активен
                  </label>
                  <select
                    aria-label="Активен"
                    value={form.active ? "1" : "0"}
                    onChange={(event) =>
                      setForm({ ...form, active: event.target.value === "1" })
                    }
                    className={inputCls}
                  >
                    <option value="1">Да</option>
                    <option value="0">Не</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Кредит
                  </label>
                  <select
                    aria-label="Кредит"
                    value={form.credit ? "1" : "0"}
                    onChange={(event) =>
                      setForm({ ...form, credit: event.target.value === "1" })
                    }
                    className={inputCls}
                  >
                    <option value="1">Да</option>
                    <option value="0">Не</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    по PC
                  </label>
                  <select
                    aria-label="по PC"
                    value={form.by_pc ? "1" : "0"}
                    onChange={(event) =>
                      setForm({ ...form, by_pc: event.target.value === "1" })
                    }
                    className={inputCls}
                  >
                    <option value="1">Да</option>
                    <option value="0">Не</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Пост Терминал
                  </label>
                  <select
                    aria-label="Пост Терминал"
                    value={form.post_terminal ? "1" : "0"}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        post_terminal: event.target.value === "1",
                      })
                    }
                    className={inputCls}
                  >
                    <option value="1">Да</option>
                    <option value="0">Не</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Коментар
                  </label>
                  <textarea
                    aria-label="Коментар"
                    value={form.comment}
                    onChange={(event) =>
                      setForm({ ...form, comment: event.target.value })
                    }
                    className={`${inputCls} min-h-20`}
                  />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDialog(null)}
                    className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Отказ
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {saving ? "Запис..." : "Запис"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
