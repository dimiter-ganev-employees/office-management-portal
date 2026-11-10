import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Фактури | Фирма" },
      { name: "description", content: "Фактури – фирмено приложение" },
      { property: "og:title", content: "Фактури | Фирма" },
      { property: "og:description", content: "Фактури – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Фактури" />,
});
