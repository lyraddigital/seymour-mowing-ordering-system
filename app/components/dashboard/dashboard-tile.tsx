interface DashboardTileProps {
  title: string;
  value?: string;
}

export default function DashboardTile({ title, value }: DashboardTileProps) {
  return (
    <div className="flex flex-col basis-[200px] h-[200px] shadow-xl border border-green-350 hover:border-green-600 p-6 rounded hover:cursor-pointer">
      <div className="text-center text-green-800 text-sm uppercase font-bold">{title}</div>
      <div className="flex items-center justify-center">
        <span className="text-2xl text-green-800 font-bold">{value}</span>
      </div>
    </div>
  );
}
