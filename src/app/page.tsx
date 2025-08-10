import { Grid, Typography } from "@mui/material";

import { LoginForm, LoginPaper } from "./components/login";
import loginLogo from "../../public/login-logo.svg";

export default function Home() {
  return (
      <LoginPaper>
        <Grid container sx={{ height: "55vh"}}>
          <Grid sx={{
            backgroundImage: `url(${loginLogo.src})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            display: {
              xs: 'none',
              md: 'flex'
            }
          }} size="grow">
            
          </Grid>
          <Grid size="grow" sx={{ p: 2, pt: 4, background: "primary.main" }}>
            <Typography variant="h4" align="center" color="white">Sign In</Typography>
            <LoginForm />
          </Grid>
        </Grid>   
      </LoginPaper>
  );
}
