import Link from "next/link";
import { PropsWithChildren } from "react";

interface DashboardSummaryTileProps extends PropsWithChildren {
  title: string;
  numberOfRecords: number; 
  description?: string;
  showMoreUrl?: string;
}

export default function DashboardListTile({ children, description, numberOfRecords, showMoreUrl, title }: DashboardSummaryTileProps) {
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
  const content = hasData ? children : (
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
