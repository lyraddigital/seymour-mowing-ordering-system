"use client";

import { createTheme } from "@mui/material";
import { green, orange } from "@mui/material/colors";

const theme = createTheme({
  palette: {
    primary: {
      main: green[800],
    },
    secondary: {
      main: orange[800],
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 439,
      md: 900,
      lg: 1280,
      xl: 1536,
    },
  },
  spacing: 4,
  typography: {
    body1: {
      fontSize: "13px",
    },
  },
});

export default theme;
