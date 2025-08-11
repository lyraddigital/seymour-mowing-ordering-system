'use client';

import { Grid, Paper, styled } from "@mui/material";
import { PropsWithChildren } from "react";

const BackgroundGrid = styled(Grid)(({ theme }) => ({
    background: theme.lighten(theme.palette.primary.main, 0.85)
}));

export default function LoginPaper({ children }: PropsWithChildren) {
    return (
        <BackgroundGrid container sx={{
            justifyContent:"center",
            alignItems:"center",
            minHeight: '100vh',
            
        }}>
            <Grid size="grow" sx={{
                maxWidth: {
                    sm: 600,
                    md: 1200
                },
                mx: 3
            }}>                
                <Paper elevation={2} sx={{ width: '100%' }}>
                    {children}
                </Paper>
            </Grid>
        </BackgroundGrid>
    );
}