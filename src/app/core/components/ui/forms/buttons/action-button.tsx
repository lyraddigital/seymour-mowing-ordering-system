'use client';

import { Button } from "@mui/material";
import React from "react";

interface ActionButtonProps {
  text: string;
  icon?: React.ReactElement;
}

export default function ActionButton({ text, icon }: ActionButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={icon}
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
