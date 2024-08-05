import clsx from "clsx";

interface DashboardTileProps {
  title: string;
  value?: string;
  color?: 'red' | 'green'
}

export default function DashboardTile({ title, value, color }: DashboardTileProps) {
  const tileClasses = clsx(
    'bg-gradient-to-r flex flex-col justify-between basis-[170px] shadow-xl border p-4 rounded-md',
    color === 'green' ? 'from-green-800 to-green-600' : color === 'red' ? 'from-red-700 to-red-400' : ''
  );
  const titleClasses = clsx(
    'text-xs uppercase font-bold',
    !!color ? 'text-white' : 'text-green-800'
  );
  const valueClasses = clsx(
    "text-2xl font-bold",
    !!color ? 'text-white' : 'text-green-800'
  );

  return (
    <div className={tileClasses}>
      <div className={titleClasses}>{title}</div>
      <div className="flex items-center">
        <span className={valueClasses}>{value}</span>
      </div>
    </div>
  );
}
