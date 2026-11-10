import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Начална | Фирма" },
      { name: "description", content: "Начална – фирмено приложение" },
      { property: "og:title", content: "Начална | Фирма" },
      { property: "og:description", content: "Начална – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Начална" />,
});
