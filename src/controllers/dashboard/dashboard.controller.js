import { sendSuccess } from "../../utils/api-response.js";
import { getDashboardSummaryService } from "./services/getDashboardSummary.dashboard.service.js";

export async function getDashboardSummary(req, res) {
  return sendSuccess(res, {
    message: "Dashboard summary retrieved successfully",
    data: await getDashboardSummaryService(),
  });
}
