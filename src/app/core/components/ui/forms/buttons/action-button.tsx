'use client';

import { Button } from "@mui/material";
import React from "react";

type ActionButtonProps = {
  text: string;
  icon?: React.ReactElement;
  onClick?: () => void;
}

export default function ActionButton({ text, icon, onClick }: ActionButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={icon}
      onClick={onClick}
      sx={{
        textTransform: "none",
        "& .MuiButton-startIcon": { marginRight: 1 },
        "& .MuiButton-label": (theme) => ({
          fontSize: theme.typography.body1.fontSize,
          fontWeight: theme.typography.body1.fontWeight,
        }),
      }}
    >
      {text}
    </Button>
  );
}
