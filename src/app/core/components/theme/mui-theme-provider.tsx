import { ThemeProvider } from "@mui/material";

import theme from "./theme";

export default function MuiThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}