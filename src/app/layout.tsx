import { CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from "next";

import { MuiThemeProvider } from "./components/theme";

export const metadata: Metadata = {
  title: "Seymour Mowing and Maintenance - Invoice Management System",
  description: "A back office system that is used to manage invoices for Seymour Mowing and Maintenance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">      
      <body>
        <AppRouterCacheProvider>
          <CssBaseline />
          <MuiThemeProvider>
            {children}
          </MuiThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
