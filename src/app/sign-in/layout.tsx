'use client';

import { Grid } from "@mui/material";
import { PropsWithChildren } from 'react';

import { PageBackground } from "@/app/core/components/ui/layout";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <PageBackground>
        <Grid container sx={{
            justifyContent:"center",
            alignItems:"center",
            minHeight: '100vh'
        }}>
            <Grid size="grow" sx={{
                maxWidth: {
                    sm: 600,
                    md: 1200
                },
                mx: 3
            }}> 
                {children}
            </Grid>
        </Grid>        
    </PageBackground>
  );
}
