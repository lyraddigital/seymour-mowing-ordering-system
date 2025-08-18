import { CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from "next";
import { PropsWithChildren } from 'react';

import { SignOutForm } from '@/app/core/components/auth';
import { MuiThemeProvider } from "@/app/core/components/theme";

export const metadata: Metadata = {
  title: "Seymour Mowing and Maintenance - Invoice Management System",
  description: "A back office system that is used to manage invoices for Seymour Mowing and Maintenance",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">      
      <body>
        <AppRouterCacheProvider>
          <CssBaseline />
          <MuiThemeProvider>
            <SignOutForm />
            {children}
          </MuiThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
