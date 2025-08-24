import { Box, Theme } from "@mui/material";
import { PropsWithChildren } from "react";

const backgroundColor = (theme: Theme) => theme.palette.grey[200];

export default function PageBackground({ children }: PropsWithChildren) {    
    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor
        }}>
            {children}
        </Box>
    );
}
