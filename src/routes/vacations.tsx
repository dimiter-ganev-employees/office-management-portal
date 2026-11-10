import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/vacations")({
  head: () => ({
    meta: [
      { title: "Отпуски | Фирма" },
      { name: "description", content: "Отпуски – фирмено приложение" },
      { property: "og:title", content: "Отпуски | Фирма" },
      { property: "og:description", content: "Отпуски – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Отпуски" />,
});
