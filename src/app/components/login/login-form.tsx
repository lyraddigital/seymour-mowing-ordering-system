'use client';

import { Box, Button, Checkbox, FormControlLabel } from "@mui/material";
import { useRouter } from "next/navigation";
import { SyntheticEvent } from "react";

import { signInWithCredentials } from "@/app/actions";

import LoginInput from "./login-input";
import PasswordInput from "./password-input";
import { Credentials } from "@/app/types";

export default function LoginForm() {
    const router = useRouter();
    const handleSignInWithCredentials = async(event: SyntheticEvent) => {
        event.preventDefault();

        const formData = new FormData(event.target as HTMLFormElement);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        } as Credentials;

        await signInWithCredentials(credentials);
        await router.replace('/');
    }

    return (
        <Box component="form" onSubmit={handleSignInWithCredentials} noValidate autoComplete="off" sx={{ m: 1 }}>
            <Box sx={{mb: 1}}>
                <LoginInput fieldName="username" label="Username *" />
            </Box>
            <Box sx={{mb: 1}}>
                <PasswordInput />
            </Box>
            <Box sx={{mt: 2, mb: 3}}>
                <FormControlLabel control={<Checkbox />} label="Remember me" />                
            </Box>
            <Box sx={{mx: { sm: 8 }}}>
                <Button type="submit" variant="contained" size="large" color="secondary" fullWidth sx={{ borderRadius: 6 }}>Sign In</Button>
            </Box>
        </Box>
    );
}