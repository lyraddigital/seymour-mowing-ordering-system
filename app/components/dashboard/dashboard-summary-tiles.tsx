import { DashboardSummary } from "@/app/models/dashboard-summary";
import { getCurrencyString } from "@/app/utilities/currency";

import DashboardSummaryTile from "./dashboard-summary-tile";

interface DashboardTilesProps {
  summary: DashboardSummary;
}

export default function DashboardSummaryTiles({ summary }: DashboardTilesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 my-3">
      <DashboardSummaryTile title="Amount Owed" color="red" value={getCurrencyString(summary.totalAmountOwed)} />
      <DashboardSummaryTile hideInMobile title="Customers owing" color="red" value={summary.numberOfCustomersOwing.toString()} />
      <DashboardSummaryTile title="Amount recieved (last 30)" color="green" value={getCurrencyString(summary.amountReceivedLastThirty)} />
      <DashboardSummaryTile hideInMobile title="Amount recieved (FY 25)" color="green" value={getCurrencyString(summary.amountReceivedLastThirty)} />
      <DashboardSummaryTile hideInMobile title="Jobs pending" color="yellow" value={"1"} />
    </div>
  );
}
