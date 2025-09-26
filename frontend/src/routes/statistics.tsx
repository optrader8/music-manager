import { createFileRoute } from "@tanstack/react-router";
import { StatisticsPage } from "@/components/Statistics/StatisticsPage";

export const Route = createFileRoute("/statistics")({
  component: StatisticsPage,
});
