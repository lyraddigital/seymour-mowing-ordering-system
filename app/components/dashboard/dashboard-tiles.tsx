import { DashboardSummary } from "@/app/models/dashboard-summary";
import { getCurrencyString } from "@/app/utilities/currency";

import SectionHeading from "../ui/section-heading";
import DashboardTile from "./dashboard-tile";

interface DashboardTilesProps {
  summary: DashboardSummary;
}

export default function DashboardTiles({ summary }: DashboardTilesProps) {
  return (
    <section>
      <header>
        <SectionHeading>Summary</SectionHeading>
      </header>
      <div className="flex gap-5 my-3">
        <DashboardTile title="Amount Owed" color="red" value={getCurrencyString(summary.totalAmountOwed)} />
        <DashboardTile title="Customers owing" color="red" value={summary.numberOfCustomersOwing.toString()} />
        <DashboardTile title="Amount recieved (last 30)" color="green" value={getCurrencyString(summary.amountReceivedLastThirty)} />
      </div>
    </section>
  );
}
