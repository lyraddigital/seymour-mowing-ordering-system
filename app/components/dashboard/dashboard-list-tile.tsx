import { PropsWithChildren } from "react";

interface DashboardSummaryTileProps extends PropsWithChildren {
  title: string;
  description?: string;
  hasNoData?: boolean
}

export default function DashboardListTile({ children, description, hasNoData, title }: DashboardSummaryTileProps) {
  const hasData = hasNoData ? !hasNoData : true;
  const titleEl = title ? <div className="mb-2 uppercase font-bold text-sm">{title}</div> : null;
  const descriptionEl = description ? <div className="mb-2 text-xs text-slate-600">{description}</div> : null;
  const headerEl = titleEl || descriptionEl ? (
    <header className="p-4 pb-1">
      {titleEl}
      {descriptionEl}
    </header>
  ) : null;
  const content = hasData ? children : (
    <div className="flex flex-1 justify-center items-center uppercase text-sm font-bold">No data to show</div>
  );

  return (
    <section className="flex flex-col bg-white rounded border border-slate-300 shadow-lg flex-1">
      {headerEl}
      {content}
    </section>
  );
}
