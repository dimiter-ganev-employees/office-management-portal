import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/countries")({
  head: () => ({
    meta: [
      { title: "Държава | Фирма" },
      { name: "description", content: "Държава – фирмено приложение" },
      { property: "og:title", content: "Държава | Фирма" },
      { property: "og:description", content: "Държава – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Държава" />,
});
