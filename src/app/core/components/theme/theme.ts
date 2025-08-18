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
});

export default theme;
