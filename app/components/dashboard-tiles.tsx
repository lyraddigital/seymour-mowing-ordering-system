import DashboardTile from "./dashboard-tile";

export default function DashboardTiles() {
  return (
    <div className="flex justify-between my-3">
        <DashboardTile title="Total Amount Used" value="$254.63" />
        <DashboardTile title="Number of customers owing" value="2" />
        <DashboardTile title="Amount recieved (last 30)" value="$2356.98" /> 
    </div>
  );
}
