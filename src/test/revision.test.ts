import { describe, expect, it } from "vitest";

import { partitionRevisionRows, sumRevisionRows, type RevisionRow } from "@/lib/revision";

const row = (id: number, amount: number, byPc: boolean, postTerminal = false): RevisionRow => ({
  id,
  problem_id: id,
  amount,
  revision_date: "2026-11-21",
  problems: { name: `Операция ${id}`, credit: false, by_pc: byPc, post_terminal: postTerminal },
});

describe("Ревизия — операции по PC", () => {
  it("отделя всички редове с по PC = Да, без да ги включва в основната ревизия", () => {
    const result = partitionRevisionRows([
      row(1, 10, false),
      row(2, 20, true),
      row(3, 30, true, true),
      row(4, 40, false, true),
    ]);

    expect(result.standardRows.map((item) => item.id)).toEqual([1]);
    expect(result.pcRows.map((item) => item.id)).toEqual([2, 3]);
  });

  it("събира сумата на редовете с по PC = Да с два знака след запетаята", () => {
    const { pcRows } = partitionRevisionRows([row(1, 100.25, true), row(2, 25.1, true), row(3, 999, false)]);

    expect(sumRevisionRows(pcRows)).toBe(125.35);
  });
});
