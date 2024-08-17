import { DashboardListItem } from "@/app/models/dashboard-list-item";

import DashboardListTileListItem from "./dashboard-list-tile-list-item";

interface DashboardListTileListItemsProps {
    items: DashboardListItem[],
}

export default function DashboardListTileListItems({ items }: DashboardListTileListItemsProps) {
    return (
        <ul className="lg:h-[231px] overflow-hidden">
            {items.map((i) => (
                <DashboardListTileListItem key={i.code} item={i} />
            ))}
        </ul>
    );
}
