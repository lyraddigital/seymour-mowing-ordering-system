'use client';

import { useState } from "react";

import { DataRefreshContext } from "@/app/core/contexts";

export default function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DataRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
}
