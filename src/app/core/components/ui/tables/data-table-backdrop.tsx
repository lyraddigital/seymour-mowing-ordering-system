import { Backdrop } from "@mui/material";

type DataTableBackdropProps = {
  isLoading: boolean;
  height: number;
};

export default function DataTableBackdrop({ isLoading, height }: DataTableBackdropProps) {
  return (
    <Backdrop
        open={isLoading}
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
