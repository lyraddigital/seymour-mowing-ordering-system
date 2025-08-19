import { Box, Grid } from "@mui/material";

import signInLogo from "@/../public/sign-in-logo.svg";

export default function SignInSidePicture() {
    return (
        <Grid size="grow" sx={{
            bgcolor: "primary.main"
        }}>
            <Box sx={{
              backgroundImage: `url(${signInLogo.src})`,            
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3,
              flex: 1,
              height: '100%'
            }}>              
            </Box>
        </Grid>
    );
}