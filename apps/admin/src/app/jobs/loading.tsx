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

export default function Loading() {
  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <nav style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
        <div className="skeleton"  style={skeletonStyle({ width: "80px", height: "20px" })} />
        <div className="skeleton"  style={skeletonStyle({ width: "70px", height: "20px" })} />
        <div className="skeleton"  style={skeletonStyle({ width: "80px", height: "20px" })} />
        <div className="skeleton"  style={skeletonStyle({ width: "50px", height: "20px" })} />
      </nav>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}
      >
        <div className="skeleton" style={skeletonStyle({ width: "100px", height: "36px" })} />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div className="skeleton" style={skeletonStyle({ width: "90px", height: "32px", borderRadius: "6px" })} />
          <div className="skeleton" style={skeletonStyle({ width: "90px", height: "32px", borderRadius: "6px" })} />
          <div className="skeleton" style={skeletonStyle({ width: "90px", height: "32px", borderRadius: "6px" })} />
          <div className="skeleton" style={skeletonStyle({ width: "70px", height: "32px", borderRadius: "6px" })} />
        </div>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "24px" }}>
        <thead>
          <tr>
            {["Customer", "Service date", "Service type", "Status"].map((column) => (
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
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: 4 }).map((_, columnIndex) => (
                <td
                  key={`${rowIndex}-${columnIndex}`}
                  style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                >
                  <div className="skeleton" style={skeletonStyle({ width: "80%", height: "16px" })} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}