const paths = {
  dashboard: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  customers:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  jobs: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M7 14h2M15 14h2M7 18h2",
  invoice: "M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h6",
  payment: "M3 4h18v16H3zM3 9h18M7 15h4",
  contact:
    "M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3z",
  address:
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0zM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  notes: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
  finance: "M3 21h18M5 18v-6h3v6M11 18V7h3v11M17 18V3h3v15",
  balance: "M12 3v18M7 21h10M4 7h16M6 7l-4 8h8zM18 7l-4 8h8z",
  danger: "m12 3 10 18H2zM12 9v5M12 17v.1",
  mail: "M3 5h18v14H3zM3 5l9 7 9-7",
  edit: "m16 3 5 5-12 12-6 1 1-6zM13 6l5 5",
  archive: "M3 4h18v4H3zM5 8v13h14V8M9 12h6",
  plus: "M12 5v14M5 12h14",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2",
} as const;

interface IconProps {
  name: keyof typeof paths;
  className?: string;
}

export default function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
