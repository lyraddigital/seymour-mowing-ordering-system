import { Typography } from "@mui/material";

import SignInForm from "./sign-in-form";

export default function SignInSection() {
    return (
        <>
            <Typography variant="h4" align="center" color="primary" sx={{ mb: 1 }}>Sign In</Typography>
            <Typography component="div" sx={{ mb: 3, textAlign: "center" }}>
                Welcome, please sign in to continue.
            </Typography>
            <SignInForm />
        </>
    );
}