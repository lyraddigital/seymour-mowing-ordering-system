import { Grid, Paper } from "@mui/material";
import { PropsWithChildren } from "react";

export default function LoginPaper({ children }: PropsWithChildren) {
    return (
        <Grid container sx={{justifyContent:"center", alignItems:"center", minHeight: '100vh'}}>
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
        </Grid>
    );
}