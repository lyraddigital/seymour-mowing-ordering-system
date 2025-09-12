import { Backdrop } from "@mui/material";

import { useDataLoading } from "@/app/core/hooks";

type DataTableBackdropProps = {
  height: number;
};

export default function DataTableBackdrop({ height }: DataTableBackdropProps) {
  const isDataLoading = useDataLoading();

  return (
    <Backdrop
        open={isDataLoading}
        sx={{
            position: "absolute",
            top: `${height}px`,
            left: 0,
            width: "100%",
            height: `calc(100% - ${height}px)`,
            zIndex: 2,
            backgroundColor: "rgba(255,255,255,0.7)"
        }}
    ></Backdrop>
  );
}
