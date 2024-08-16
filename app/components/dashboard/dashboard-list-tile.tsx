import Link from "next/link";

import { DashboardListItem } from "@/app/models/dashboard-list-item";

interface DashboardListTileProps {
  title: string;
  items?: DashboardListItem[],
  description?: string;
  showMoreUrl?: string;
}

export default function DashboardListTile({ description, items, showMoreUrl, title }: DashboardListTileProps) {
  const numberOfRecords = (items || []).length;
  const hasData = numberOfRecords > 0;
  const canShowMoreUrl = numberOfRecords > 10;
  const titleEl = title ? <div className="mb-2 uppercase font-bold text-sm">{title}</div> : null;
  const descriptionEl = description ? <div className="mb-2 text-xs text-slate-600">{description}</div> : null;
  const headerEl = titleEl || descriptionEl ? (
    <header className="p-4 pb-1">
      {titleEl}
      {descriptionEl}
    </header>
  ) : null;
  const content = hasData ? (
    <ul>
      {items && items.length > 0 &&
        items.map((i) => (
          <li key={i.code} className="gap-10 p-4 text-sm flex justify-between hover:bg-slate-200 border-b">
            <div className="flex flex-col flex-1 gap-1">
              <span className="font-bold">{i.title}</span>
              <span className="text-slate-500">                
                {i.summary}
              </span>
            </div>
            <div className="flex justify-center items-center flex-[100px] grow-0">
              <Link className="text-green-800 active:text-green-500 uppercase" href={i.pageLink}>
                View
              </Link>
            </div>
          </li>
        ))}
    </ul>
  ) : (
    <div className="p-4 flex flex-1 justify-center items-center uppercase text-sm font-bold">No data to show</div>
  );
  const footerEl = hasData && !!showMoreUrl && canShowMoreUrl ? (
    <div className="flex-1 py-5 flex justify-center items-end">
      <Link className="uppercase text-green-700 hover:text-green-500" href={showMoreUrl}>Show More</Link>
    </div>    
  ) : null;

  return (
    <section className="flex flex-col bg-white rounded border border-slate-300 shadow-lg flex-1">
      {headerEl}
      {content}
      {footerEl}
    </section>
  );
}
