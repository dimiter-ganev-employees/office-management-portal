import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const settingsLinks = [
  { to: "/groups", label: "Групи" },
  { to: "/users", label: "Потребители" },
  { to: "/cities", label: "Град" },
  { to: "/countries", label: "Държава" },
] as const;

const navCls = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground";
const activeCls = { className: "bg-accent text-foreground" };

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <div className="flex h-10 w-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          ЛОГО
        </div>
        <nav className="flex flex-1 items-center gap-1">
          <Link to="/" className={navCls} activeProps={activeCls} activeOptions={{ exact: true }}>Начална</Link>
          <Link to="/vacations" className={navCls} activeProps={activeCls}>Отпуски</Link>
          <Link to="/invoices" className={navCls} activeProps={activeCls}>Фактури</Link>
          <div className="relative" onMouseLeave={() => setOpen(false)}>
            <button className={`${navCls} inline-flex items-center gap-1`} onClick={() => setOpen((o) => !o)} onMouseEnter={() => setOpen(true)}>
              Настройки <ChevronDown className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute left-0 top-full z-50 min-w-44 rounded-md border bg-popover p-1 shadow-md">
                {settingsLinks.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-sm px-3 py-2 text-sm text-popover-foreground hover:bg-accent" activeProps={{ className: "bg-accent" }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Вход</button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-2 px-4 py-6 text-sm text-muted-foreground sm:grid-cols-4">
        <div className="font-semibold text-foreground">Фирма ООД</div>
        <div>Адрес: ул. Примерна 1, София</div>
        <div>Телефон: +359 2 000 0000</div>
        <div>Имейл: office@firma.bg</div>
      </div>
    </footer>
  );
}

export function PageShell({ title }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
    </div>
  );
}
