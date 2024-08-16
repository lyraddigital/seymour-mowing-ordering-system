import clsx from "clsx";

interface DashboardSummaryTileProps {
  title: string;
  value?: string;
  className?: string;
  color?: 'red' | 'green' | 'yellow'
}

export default function DashboardSummaryTile({ className, title, value, color }: DashboardSummaryTileProps) {
  const tileClasses = clsx(
    'bg-gradient-to-r flex flex-col justify-between sm:h-[85px] shadow-xl border p-3 rounded-md',
    color === 'green' ? 'from-green-800 to-green-600 border-green-700' : color === 'red' ? 'from-red-700 to-red-400 border-red-700' : color === 'yellow' ? 'from-yellow-600 to-yellow-300 border-yellow-700' : '',
    className
  );
  const titleClasses = clsx(
    'text-xs uppercase font-bold text-center',
    color === 'yellow' ? 'text-slate-950' : 'text-white'
  );
  const valueClasses = clsx(
    "text-center text-xl font-bold",
    color === 'yellow' ? 'text-slate-950' : 'text-white'
  );

  return (
    <div className={tileClasses}>
      <div className={titleClasses}>{title}</div>
      <div className="flex justify-center">
        <span className={valueClasses}>{value}</span>
      </div>
    </div>
  );
}
