import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Групи | Фирма" },
      { name: "description", content: "Списък с групи – добавяне, редакция, изтриване, сортиране и филтриране" },
      { property: "og:title", content: "Групи | Фирма" },
      { property: "og:description", content: "Списък с групи – добавяне, редакция, изтриване, сортиране и филтриране" },
    ],
  }),
  component: GroupsPage,
});

type Group = {
  id: number;
  name: string;
  comment: string | null;
};

type SortKey = "id" | "name" | "comment";
type SortDir = "asc" | "desc";

type DialogState =
  | { mode: "view"; group: Group }
  | { mode: "edit"; group: Group }
  | { mode: "add" }
  | { mode: "delete"; group: Group }
  | null;

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filters, setFilters] = useState<Record<SortKey, string>>({
    id: "",
    name: "",
    comment: "",
  });

  const [dialog, setDialog] = useState<DialogState>(null);
  const [formName, setFormName] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, comment")
      .order("id", { ascending: true });
    if (error) setError(error.message);
    else setGroups(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const visible = useMemo(() => {
    const filtered = groups.filter((g) => {
      const idOk = filters.id.trim() === "" || String(g.id).includes(filters.id.trim());
      const nameOk =
        filters.name.trim() === "" ||
        g.name.toLowerCase().includes(filters.name.trim().toLowerCase());
      const commentOk =
        filters.comment.trim() === "" ||
        (g.comment ?? "").toLowerCase().includes(filters.comment.trim().toLowerCase());
      return idOk && nameOk && commentOk;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "id") return (a.id - b.id) * dir;
      const av = sortKey === "name" ? a.name : (a.comment ?? "");
      const bv = sortKey === "name" ? b.name : (b.comment ?? "");
      return av.localeCompare(bv, "bg") * dir;
    });
  }, [groups, filters, sortKey, sortDir]);

  const openDialog = (d: NonNullable<DialogState>) => {
    setFormError(null);
    if (d.mode === "add") {
      setFormName("");
      setFormComment("");
    } else if (d.mode === "edit") {
      setFormName(d.group.name);
      setFormComment(d.group.comment ?? "");
    }
    setDialog(d);
  };

  const save = async () => {
    const name = formName.trim();
    if (!name) {
      setFormError("Полето „Име“ е задължително.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const comment = formComment.trim() || null;
    const result =
      dialog?.mode === "edit"
        ? await supabase.from("groups").update({ name, comment }).eq("id", dialog.group.id)
        : await supabase.from("groups").insert({ name, comment });
    setSaving(false);
    if (result.error) {
      setFormError(result.error.message);
      return;
    }
    setDialog(null);
    await load();
  };

  const remove = async (group: Group) => {
    setSaving(true);
    const { error } = await supabase.from("groups").delete().eq("id", group.id);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setDialog(null);
    await load();
  };

  const sortIcon = (key: SortKey) =>
    sortKey !== key ? (
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Групи</h1>
        <button
          onClick={() => openDialog({ mode: "add" })}
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
              {(
                [
                  ["id", "ID"],
                  ["name", "Име"],
                  ["comment", "Коментар"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th key={key} className="px-4 py-3">
                  <button
                    onClick={() => toggleSort(key)}
                    className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                  >
                    {label} {sortIcon(key)}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-foreground">Действия</th>
            </tr>
            <tr className="border-b bg-muted/20">
              {(["id", "name", "comment"] as SortKey[]).map((key) => (
                <th key={key} className="px-4 py-2">
                  <input
                    value={filters[key]}
                    onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder="Филтър..."
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Зареждане...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Няма намерени групи.
                </td>
              </tr>
            ) : (
              visible.map((g) => (
                <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{g.id}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{g.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.comment ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Преглед"
                        onClick={() => openDialog({ mode: "view", group: g })}
                        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        title="Редакция"
                        onClick={() => openDialog({ mode: "edit", group: g })}
                        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Изтриване"
                        onClick={() => openDialog({ mode: "delete", group: g })}
                        className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDialog(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {dialog.mode === "add" && "Нова група"}
                {dialog.mode === "edit" && "Редакция на група"}
                {dialog.mode === "view" && "Преглед на група"}
                {dialog.mode === "delete" && "Изтриване на група"}
              </h2>
              <button
                onClick={() => setDialog(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {dialog.mode === "view" && (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-medium text-foreground">{dialog.group.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Име</dt>
                  <dd className="font-medium text-foreground">{dialog.group.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Коментар</dt>
                  <dd className="font-medium text-foreground">{dialog.group.comment ?? "—"}</dd>
                </div>
              </dl>
            )}

            {(dialog.mode === "add" || dialog.mode === "edit") && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Име <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={inputCls}
                    placeholder="Име на групата"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Коментар</label>
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className={`${inputCls} min-h-20`}
                    placeholder="Коментар (незадължително)"
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
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "Запис..." : "Запис"}
                  </button>
                </div>
              </div>
            )}

            {dialog.mode === "delete" && (
              <div className="space-y-4">
                <p className="text-sm text-foreground">
                  Сигурни ли сте, че искате да изтриете група „{dialog.group.name}“?
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
                    onClick={() => remove(dialog.group)}
                    disabled={saving}
                    className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {saving ? "Изтриване..." : "Изтрий"}
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
