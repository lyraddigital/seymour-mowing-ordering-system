import DashboardTiles from "./components/dashboard-tiles";
import DashboardCustomersTable from "./components/dashboard-customers-table";

export default function Home() {
  return (
    <>
      <h1 className="text-4xl mb-8 mt-6">Dashboard</h1>
      
      <DashboardTiles />
      <DashboardCustomersTable />           
    </>
  );
}
