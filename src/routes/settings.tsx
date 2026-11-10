import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Настройки | Фирма" },
      { name: "description", content: "Настройки – фирмено приложение" },
      { property: "og:title", content: "Настройки | Фирма" },
      { property: "og:description", content: "Настройки – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Настройки" />,
});
