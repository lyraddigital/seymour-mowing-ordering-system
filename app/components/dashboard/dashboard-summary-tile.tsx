import clsx from "clsx";

interface DashboardSummaryTileProps {
  title: string;
  value?: string;
  color?: 'red' | 'green'
}

export default function DashboardSummaryTile({ title, value, color }: DashboardSummaryTileProps) {
  const tileClasses = clsx(
    'bg-gradient-to-r flex flex-col justify-between h-[85px] shadow-xl border p-3 rounded-md',
    color === 'green' ? 'from-green-800 to-green-600 border-green-700' : color === 'red' ? 'from-red-700 to-red-400 border-red-700' : ''
  );
  const titleClasses = clsx(
    'text-xs uppercase font-bold text-center',
    !!color ? 'text-white' : 'text-green-800'
  );
  const valueClasses = clsx(
    "text-center text-xl font-bold",
    !!color ? 'text-white' : 'text-green-800'
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
