import { Box, Grid, Typography } from "@mui/material";

import { LoginForm, LoginPaper } from "../components/login";
import loginLogo from "../../../public/login-logo.svg";

export default function SignIn() {
  return (
    <LoginPaper>
      <Grid container sx={{ height: "55vh"}}>
        <Grid container sx={{          
          bgcolor: "primary.main",
          display: {
            xs: 'none',
            md: 'flex'
          }
        }} size="grow">
          <Grid size="grow" sx={{
            backgroundImage: `url(${loginLogo.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
          }}></Grid>
        </Grid>
        <Grid size="grow" sx={{ p: 2, pt: 4 }}>
          <Typography variant="h4" align="center" color="primary" sx={{ mb: 1 }}>Sign In</Typography>
          <Typography component="div" sx={{ mb: 3, textAlign: "center" }}>Welcome, please sign in to continue.</Typography>
          <LoginForm />
        </Grid>
      </Grid>   
    </LoginPaper>
  );
}
