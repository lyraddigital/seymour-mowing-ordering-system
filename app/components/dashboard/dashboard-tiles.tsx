import SectionHeading from "../ui/section-heading";
import DashboardTile from "./dashboard-tile";

export default function DashboardTiles() {
  return (
    <section>
      <header>
        <SectionHeading>Summary</SectionHeading>
      </header>
      <div className="flex gap-20 my-3">
        <DashboardTile title="Total Amount Owed" value="$254.63" />
        <DashboardTile title="Number of customers owing" value="2" />
        <DashboardTile title="Amount recieved (last 30)" value="$2356.98" /> 
      </div>
    </section>    
  );
}
