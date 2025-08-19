import { Paper } from "@mui/material";
import { PropsWithChildren } from "react";

export default function SignInPaper({ children }: PropsWithChildren) {
    return (
        <Paper elevation={2} sx={{ width: '100%' }}>
            {children}
        </Paper>
    );
}