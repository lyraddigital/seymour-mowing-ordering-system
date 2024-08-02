import DashboardTiles from "./components/dashboard/dashboard-tiles";
import DashboardCustomersTable from "./components/dashboard/dashboard-customers-table";
import DashboardJobsTable from "./components/dashboard/dashboard-jobs-table";

export default function Home() {
  return (
    <>      
      <DashboardTiles />
      <DashboardCustomersTable />
      <DashboardJobsTable />
    </>
  );
}
