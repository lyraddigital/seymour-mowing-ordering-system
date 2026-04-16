function skeletonStyle({
  width = "100%",
  height = "16px",
  borderRadius = "6px"
}: {
  width?: string;
  height?: string;
  borderRadius?: string;
} = {}): React.CSSProperties {
  return {
    width,
    height,
    borderRadius,
    backgroundColor: "#e5e7eb"    
  };
}

function DashboardCardSkeleton() {
  return (
    <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "220px" }}>
      <div className="skeleton" style={skeletonStyle({ width: "140px", height: "20px" })} />
      <div style={{ height: "12px" }} />
      <div className="skeleton" style={skeletonStyle({ width: "100px", height: "16px" })} />
      <div style={{ height: "12px" }} />
      <div className="skeleton" style={skeletonStyle({ width: "70px", height: "32px" })} />
    </div>
  );
}

function TableSkeleton({
  title,
  columns,
  rows
}: {
  title: string;
  columns: string[];
  rows: number;
}) {
  return (
    <section style={{ marginTop: "32px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px"
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div className="skeleton" style={skeletonStyle({ width: "90px", height: "32px", borderRadius: "6px" })} />
          <div className="skeleton" style={skeletonStyle({ width: "90px", height: "32px", borderRadius: "6px" })} />
          <div className="skeleton" style={skeletonStyle({ width: "90px", height: "32px", borderRadius: "6px" })} />
        </div>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #ccc",
                  padding: "8px"
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column}`}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <div className="skeleton" style={skeletonStyle({ width: "80%", height: "16px" })} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Loading() {
  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <div className="skeleton" style={skeletonStyle({ width: "260px", height: "36px" })} />

      <nav style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
        <div className="skeleton" style={skeletonStyle({ width: "80px", height: "20px" })} />
        <div className="skeleton" style={skeletonStyle({ width: "70px", height: "20px" })} />
        <div className="skeleton" style={skeletonStyle({ width: "80px", height: "20px" })} />
        <div className="skeleton" style={skeletonStyle({ width: "50px", height: "20px" })} />
      </nav>

      <section style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </section>

      <TableSkeleton
        title="Scheduled jobs"
        columns={["Customer", "Service date", "Service type", "Status"]}
        rows={3}
      />

      <TableSkeleton
        title="Recently completed jobs"
        columns={["Customer", "Service date", "Service type", "Status"]}
        rows={3}
      />

      <TableSkeleton
        title="Unpaid invoices"
        columns={["Invoice", "Customer", "Issue date", "Due date", "Balance due", "Aging"]}
        rows={4}
      />
    </main>
  );
}