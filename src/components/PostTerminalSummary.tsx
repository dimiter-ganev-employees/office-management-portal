import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPostTerminalSummary, type RevisionRow } from "@/lib/revision";

const money = (n: number) => n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PostTerminalSummary({ date }: { date: string }) {
  const [rows, setRows] = useState<RevisionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("revisions")
      .select("id, problem_id, amount, revision_date, problems(name, credit, by_pc, post_terminal)")
      .eq("revision_date", date)
      .order("id");
    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data ?? []) as unknown as RevisionRow[]);
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  const summary = getPostTerminalSummary(rows);

  return (
    <section className="mb-4 rounded-lg border bg-card p-4" aria-label="Пост терминал обобщение">
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-64 flex-1 items-center justify-between gap-4 rounded-md border bg-background px-4 py-3">
          <span className="text-sm font-medium text-foreground">Сптавка Пост терминал</span>
          <span className="text-lg font-semibold text-foreground">{money(summary.postTerminalReport)}</span>
        </div>
        <div className="flex min-w-64 flex-1 items-center justify-between gap-4 rounded-md border bg-background px-4 py-3">
          <span className="text-sm font-medium text-foreground">Пост терминал</span>
          <span className="text-lg font-semibold text-foreground">{money(summary.postTerminal)}</span>
        </div>
      </div>
    </section>
  );
}
