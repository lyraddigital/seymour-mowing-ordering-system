interface DashboardTileProps {
    title: string;
    value: string;
}

export default function DashboardTile({ title, value }: DashboardTileProps) {
  return (
    <div className="flex flex-col flex-1 shadow-xl border border-slate-400 p-2 max-w-80 h-32">
        <div className="text-md uppercase font-bold">{title}</div>
        <div className="flex-1 flex items-center justify-center">
        <span className="text-4xl">{value}</span>
        </div>
    </div>
  );
}
