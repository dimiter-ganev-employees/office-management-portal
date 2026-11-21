export type RevisionProblem = {
  name: string;
  credit: boolean;
  by_pc: boolean;
  post_terminal: boolean;
};

export type RevisionRow = {
  id: number;
  problem_id: number;
  amount: number;
  revision_date: string;
  problems: RevisionProblem | null;
};

// В основната ревизия не участват операции „по PC“ или „Пост Терминал“.
const isExcluded = (problem: RevisionProblem | null) =>
  !!problem && (problem.by_pc === true || problem.post_terminal === true);

export function partitionRevisionRows(rows: RevisionRow[]) {
  return {
    standardRows: rows.filter((row) => !isExcluded(row.problems)),
    pcRows: rows.filter((row) => row.problems?.by_pc === true),
  };
}

export const sumRevisionRows = (rows: RevisionRow[]) =>
  Math.round(rows.reduce((sum, row) => sum + Number(row.amount), 0) * 100) / 100;

export const calculateRevisionDifference = (turnover: number, pcTotal: number) =>
  Math.round((turnover - pcTotal) * 100) / 100;

export function getPostTerminalSummary(rows: RevisionRow[]) {
  return {
    postTerminalReport: sumRevisionRows(rows.filter((row) => row.problems?.post_terminal === true)),
    postTerminal: sumRevisionRows(rows.filter((row) => row.problems?.name === "Пост терминал")),
  };
}
