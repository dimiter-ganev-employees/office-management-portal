import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/cities")({
  head: () => ({
    meta: [
      { title: "Град | Фирма" },
      { name: "description", content: "Град – фирмено приложение" },
      { property: "og:title", content: "Град | Фирма" },
      { property: "og:description", content: "Град – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Град" />,
});
