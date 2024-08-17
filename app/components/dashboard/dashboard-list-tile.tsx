import { DashboardListItem } from "@/app/models/dashboard-list-item";

import DashboardListTileListItems from "./dashboard-list-tile-list-items";
import DashboardListTileHeader from "./dashboard-list-tile-header";

interface DashboardListTileProps {
  title: string;
  items?: DashboardListItem[],
  description?: string;
}

export default function DashboardListTile({ description, items, title }: DashboardListTileProps) {
  const numberOfRecords = (items || []).length;
  const hasData = numberOfRecords > 0;
  const content = hasData ? <DashboardListTileListItems items={items!} /> : (
    <div className="lg:h-[231px] p-4 flex flex-1 justify-center items-center uppercase text-sm font-bold">No data to show</div>
  );

  return (
    <section className={`bg-white rounded border border-slate-300 shadow-lg flex-1 overflow-hidden`}>
      <DashboardListTileHeader
        title={title}
        description={description}
      />
      {content}
    </section>
  );
}
