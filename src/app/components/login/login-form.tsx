'use client';

import { Alert, Box, Button, Checkbox, FormControlLabel } from "@mui/material";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";

import { signInWithCredentials } from "@/app/actions";

import LoginInput from "./login-input";
import PasswordInput from "./password-input";

export default function LoginForm() {
    const [isLoginFailure, setIsLoginFailure] = useState<boolean>(false);
    const [loginPending, setLoginPending] = useState<boolean>(false);
    const router = useRouter();
    
    const handleSignInWithCredentials = async(event: SyntheticEvent) => {
        event.preventDefault();

        const formData = new FormData(event.target as HTMLFormElement);

        try {
            setIsLoginFailure(false);
            setLoginPending(true);

            await signInWithCredentials(formData);
            await router.replace('/');
        } catch {
            setIsLoginFailure(true);
        } finally {
            setLoginPending(false);
        }
    }

    return (
        <Box component="form" onSubmit={handleSignInWithCredentials} noValidate autoComplete="off" sx={{ m: 1 }}>
            {isLoginFailure && <Alert severity="error" sx={{ mb: 3 }}>
                Could not log you in. Check your username and password and try again.
            </Alert>}
            <Box sx={{mb: 1}}>
                <LoginInput fieldName="username" error={isLoginFailure} label="Username *" />
            </Box>
            <Box sx={{mb: 1}}>
                <PasswordInput error={isLoginFailure} />
            </Box>
            <Box sx={{mt: 2, mb: 3}}>
                <FormControlLabel control={<Checkbox name="rememberMe" />} label="Remember me" />                
            </Box>
            <Box sx={{mx: { sm: 8 }}}>                
                <Button 
                    type="submit"
                    disabled={loginPending}
                    loading={loginPending}
                    loadingPosition="start"
                    variant="contained"
                    size="large" color="secondary"
                    fullWidth
                    sx={{ borderRadius: 6 }}
                >Sign In</Button>
            </Box>
        </Box>
    );
}