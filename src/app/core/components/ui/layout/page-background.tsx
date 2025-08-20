'use client';

import { Box, useTheme } from "@mui/material";
import { PropsWithChildren } from "react";

export default function PageBackground({ children }: PropsWithChildren) {
    const theme = useTheme();

    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor: theme.palette.grey[200]
        }}>
            {children}
        </Box>
    );
}
