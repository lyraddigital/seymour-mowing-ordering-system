import DashboardListTiles from "./components/dashboard/dashboard-list-tiles";
import DashboardSummaryTiles from "./components/dashboard/dashboard-summary-tiles";
import client from "./graphql/graphql-client";
import { getDashboardQuery } from "./graphql/queries/get-dashboard";
import { GetDashboardResult } from "./models/get-dashboard-result";

export default async function Home() {
  const { getDashboard } = await client.request<GetDashboardResult>(getDashboardQuery);

  return (
    <>
      <header>
        <h1 className="text-3xl text-green-800 font-bold uppercase my-6">Dashboard</h1>
      </header>
      <DashboardSummaryTiles summary={getDashboard.summary} />
      <DashboardListTiles
        customersOwing={getDashboard?.customersOwing}
        unpaidInvoices={getDashboard?.unpaidInvoices}
        latestJobs={getDashboard?.latestJobs}
        recentPayments={getDashboard?.recentPayments} />
    </>
  );
}
