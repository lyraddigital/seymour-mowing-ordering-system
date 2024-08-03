import DashboardTiles from "./components/dashboard/dashboard-tiles";
import DashboardCustomersTable from "./components/dashboard/dashboard-customers-table";
import DashboardJobsTable from "./components/dashboard/dashboard-jobs-table";
import { getDashboardQuery } from "./graphql/queries/get-dashboard";
import client from "./graphql/graphql-client";
import { GetDashboardResult } from "./models/get-dashboard-result";

export default async function Home() {
  const { getDashboard } = await client.request<GetDashboardResult>(getDashboardQuery);

  return (
    <>
      <DashboardTiles summary={getDashboard.summary} />
      <DashboardCustomersTable customers={getDashboard.customersOwing} />
      <DashboardJobsTable jobs={getDashboard.latestJobs} />
    </>
  );
}
