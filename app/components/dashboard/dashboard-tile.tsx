interface DashboardTileProps {
  title: string;
  value?: string;
}

export default function DashboardTile({ title, value }: DashboardTileProps) {
  return (
    <div className="bg-white flex flex-col basis-[200px] shadow-xl border border-green-800 p-6 rounded-xl">
      <div className="text-center text-green-800 text-sm uppercase font-bold">{title}</div>
      <div className="flex items-center justify-center">
        <span className="text-2xl text-green-800 font-bold">{value}</span>
      </div>
    </div>
  );
}
