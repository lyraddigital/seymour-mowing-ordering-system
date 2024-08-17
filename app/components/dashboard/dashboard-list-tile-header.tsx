interface DashboardListTileHeaderProps {
    title?: string;
    description?: string;
}

export default function DashboardListTileHeader({ title, description }: DashboardListTileHeaderProps) {
    const titleEl = title ? <div className="mb-2 uppercase font-bold text-sm truncate">{title}</div> : null;
    const descriptionEl = description ? <div className="mb-2 text-xs text-slate-600 truncate">{description}</div> : null;

    return titleEl || descriptionEl ? (
        <header className="h-[72px] p-4 pb-1 overflow-hidden">
            {titleEl}
            {descriptionEl}
        </header>
    ) : null;
}
