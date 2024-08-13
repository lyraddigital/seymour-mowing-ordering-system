import DashboardSummaryTiles from "./components/dashboard/dashboard-summary-tiles";
import DashboardCustomersList from "./components/dashboard/dashboard-customers-list";
import DashboardInvoiceList from "./components/dashboard/dashboard-invoice-list";
import DashboardJobsList from "./components/dashboard/dashboard-jobs-list";
import DashboardListTile from "./components/dashboard/dashboard-list-tile";
import client from "./graphql/graphql-client";
import { getDashboardQuery } from "./graphql/queries/get-dashboard";
import { GetDashboardResult } from "./models/get-dashboard-result";

export default async function Home() {
  const { getDashboard } = await client.request<GetDashboardResult>(getDashboardQuery);
  const noCustomerOwingData = !getDashboard?.customersOwing;
  const noInvoicesUnpaid = !getDashboard?.unpaidInvoices;
  const noLatestJobData = !getDashboard?.latestJobs;

  return (
    <>
      <header>
        <h1 className="text-3xl text-green-800 font-bold uppercase my-6">Dashboard</h1>
      </header>
      <DashboardSummaryTiles summary={getDashboard.summary} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10 min-h-32">
        <DashboardListTile title="Customers Owing" description="Number of customers owing money currently" hasNoData={noCustomerOwingData}>
          <DashboardCustomersList customers={getDashboard?.customersOwing} />
        </DashboardListTile>
        <DashboardListTile title="Unpaid Invoices" description="The number of invoices that are yet to be fully paid" hasNoData={noInvoicesUnpaid}>
          <DashboardInvoiceList unpaidInvoices={getDashboard?.unpaidInvoices} />
        </DashboardListTile>
        <DashboardListTile title="Jobs to complete" description="The latest jobs that have been registered" hasNoData={noLatestJobData}>
          <DashboardJobsList jobs={getDashboard?.latestJobs} />
        </DashboardListTile>
      </div>
    </>
  );
}
