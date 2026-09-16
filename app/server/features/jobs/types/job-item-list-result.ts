import type { JobItemSummary } from "./job-item-summary";

export interface JobItemListResult {
  items: JobItemSummary[];
  totalCents: number;
}
