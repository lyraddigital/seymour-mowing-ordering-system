import { Grid } from "@mui/material";

import { SignInPaper, SignInSection, SignInSidePicture } from "./components";

export default function SignIn() {
  return (
    <SignInPaper>
      <Grid container sx={{ minHeight: "55vh" }}>
        <Grid container sx={{          
          display: {
            xs: 'none',
            md: 'flex'
          }
        }} size="grow">
          <SignInSidePicture />
        </Grid>
        <Grid size="grow" sx={{ p: 2, pt: 4 }}>
          <SignInSection />          
        </Grid>
      </Grid>   
    </SignInPaper>
  );
}
