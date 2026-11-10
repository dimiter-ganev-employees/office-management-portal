import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Потребители | Фирма" },
      { name: "description", content: "Потребители – фирмено приложение" },
      { property: "og:title", content: "Потребители | Фирма" },
      { property: "og:description", content: "Потребители – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Потребители" />,
});
