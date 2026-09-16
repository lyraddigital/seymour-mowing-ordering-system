import type { JobItemSummary } from "./ob-item-summary";

export interface JobItemListResult {
  items: JobItemSummary[];
  totalCents: number;
}
