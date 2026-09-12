import { getDashboardSummaryService } from "./services/getDashboardSummary.dashboard.service.js";

export async function getDashboardSummary(req, res) {
  res.json({ data: await getDashboardSummaryService() });
}
