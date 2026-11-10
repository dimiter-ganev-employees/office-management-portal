import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Групи | Фирма" },
      { name: "description", content: "Групи – фирмено приложение" },
      { property: "og:title", content: "Групи | Фирма" },
      { property: "og:description", content: "Групи – фирмено приложение" },
    ],
  }),
  component: () => <PageShell title="Групи" />,
});
