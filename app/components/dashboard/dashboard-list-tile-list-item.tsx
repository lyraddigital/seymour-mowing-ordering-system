import Link from "next/link";

import { DashboardListItem } from "@/app/models/dashboard-list-item";

interface DashboardListTileListItemProps {
    item: DashboardListItem,
}

export default function DashboardListTileListItem({ item }: DashboardListTileListItemProps) {
    return (
        <li key={item.code} className="h-[77px] gap-3 p-4 text-sm flex justify-between hover:bg-slate-200 border-b">
            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                <span className="font-bold text-nowrap truncate">{item.title}</span>
                <span className="text-slate-500 text-nowrap truncate">
                    {item.summary}
                </span>
            </div>
            <div className="flex justify-center items-center flex-[100px] grow-0">
                <Link className="text-green-800 active:text-green-500 uppercase" href={item.pageLink}>
                    View
                </Link>
            </div>
        </li>
    );
}
