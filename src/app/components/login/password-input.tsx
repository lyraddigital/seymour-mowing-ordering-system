// 'use client';

import { IconButton, InputAdornment, OutlinedInput } from "@mui/material";
// import { Visibility, VisibilityOff } from '@mui/icons-material';
// import { useState } from "react";

export default function PasswordInput() {    
    // const [showPassword, setShowPassword] = useState<boolean>(false);
    // const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <OutlinedInput 
            label="Password *"
            // endAdornment={
            //     <InputAdornment position="end">
            //         <IconButton
            //             aria-label={
            //                 showPassword ? 'hide the password' : 'display the password'
            //             }
            //             onClick={handleClickShowPassword}
            //             edge="end"
            //             >
            //             {showPassword ? <VisibilityOff /> : <Visibility />}
            //         </IconButton>
            //     </InputAdornment>
            // }
            // type={showPassword ? 'text' : 'password'} 
            fullWidth />
    );
}